package GenderHealthCareSystem.service;


import GenderHealthCareSystem.dto.ConsultantBookingDetailResponse;
import GenderHealthCareSystem.dto.ConsultantBookingRequest;
import GenderHealthCareSystem.dto.ConsultantBookingResponse;
import GenderHealthCareSystem.dto.PageResponse;
import GenderHealthCareSystem.model.ConsultationBooking;
import GenderHealthCareSystem.model.Users;
import GenderHealthCareSystem.repository.ConsultationBookingRepository;
import GenderHealthCareSystem.repository.UserRepository;
import GenderHealthCareSystem.util.PageResponseUtil;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import GenderHealthCareSystem.enums.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsultantBookingService {

    private final ConsultationBookingRepository bookingRepo;
    private final UserRepository userRepository;


    /**
     * Tạo booking mới: PENDING/UNPAID và trả về URL thanh toán
     */
    private void validateBookingRequest(ConsultantBookingRequest req) {
        LocalDateTime now = LocalDateTime.now();

        if (req.getBookingDate().isBefore(now)) {
            throw new IllegalArgumentException("Không thể đặt lịch trong quá khứ.");
        }

        if (req.getBookingDate().isBefore(now.plusMinutes(30))) {
            throw new IllegalArgumentException("Phải đặt lịch trước ít nhất 30 phút.");
        }

        if (req.getBookingDate().isAfter(now.plusDays(30))) {
            throw new IllegalArgumentException("Chỉ được đặt lịch trong vòng 30 ngày tới.");
        }
    }

    @Transactional
    public ConsultantBookingResponse createBooking(ConsultantBookingRequest req, int customerId) {
        validateBookingRequest(req);

        Users consultant = userRepository.findById(req.getConsultantId())
                .orElseThrow(() -> new IllegalArgumentException("Consultant không tồn tại"));
        Users customer = userRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer không tồn tại"));

        Optional<ConsultationBooking> conflict = bookingRepo.findConflict(
                req.getConsultantId(),
                req.getBookingDate().minusMinutes(30),
                req.getBookingDate().plusMinutes(30));
        if (conflict.isPresent()) {
            throw new IllegalArgumentException("Consultant đã có lịch hẹn vào thời điểm này");
        }

        ConsultationBooking booking = new ConsultationBooking();
        booking.setConsultant(consultant);
        booking.setCustomer(customer);
        booking.setBookingDate(req.getBookingDate());
        booking.setNote(req.getNote());
        booking.setStatus(BookingStatus.PENDING);
        booking.setPaymentStatus("UNPAID");
        booking.setCreatedAt(LocalDateTime.now());

        booking = bookingRepo.save(booking);

        return new ConsultantBookingResponse(
                booking.getBookingId(),
                booking.getConsultant().getFullName(),
                booking.getBookingDate(),
                BigDecimal.ZERO.doubleValue(), // Default amount
                booking.getPaymentStatus(),
                null, // Default payment method
                booking.getMeetLink(),
                booking.getStatus().name(),
                booking.getConsultant().getUserId(),
                booking.getCustomer().getFullName() // Added customerName
        );
    }




//
//    /** Consultant view: full booking details including customer name and contact **/
//    public List<ConsultantBookingDetailResponse> getScheduleForConsultant(Integer consultantId) {
//        Users consultant = userRepository.findById(consultantId)
//                .orElseThrow(() -> new IllegalArgumentException("Consultant không tồn tại"));
//        List<ConsultationBooking> bookings = bookingRepo.findByConsultant(consultant);
//        return bookings.stream().map(b -> new ConsultantBookingDetailResponse(
//                b.getBookingId(),
//                b.getCustomer().getFullName(),
//                b.getCustomer().getUserId(),
//                b.getBookingDate(),
//                b.getStatus().name(), // Convert BookingStatus to String
//                b.getPaymentStatus(),
//                b.getInvoice() != null ? b.getInvoice().getPaymentMethod() : null, // Added paymentMethod mapping
//                b.getMeetLink()
//        )).collect(Collectors.toList());
//    }

    public Map<String, List<LocalDateTime>> getConsultantCalendar(Integer consultantId) {
        Users consultant = userRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException("Consultant không tồn tại"));

        List<LocalDateTime> bookedSlots = bookingRepo.findByConsultant(consultant)
                .stream().map(ConsultationBooking::getBookingDate)
                .collect(Collectors.toList());

        // Giả sử bạn muốn xem 2 ngày tiếp theo: mỗi ngày từ 08:00 - 17:00, cách nhau 1h
        List<LocalDateTime> availableSlots = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now().withMinute(0).withSecond(0).withNano(0);
        for (int day = 0; day < 2; day++) {
            LocalDateTime start = now.plusDays(day).withHour(8);
            for (int hour = 0; hour <= 9; hour++) {
                LocalDateTime slot = start.plusHours(hour);
                if (!bookedSlots.contains(slot)) {
                    availableSlots.add(slot);
                }
            }
        }

        Map<String, List<LocalDateTime>> result = new HashMap<>();
        result.put("bookedSlots", bookedSlots);
        result.put("availableSlots", availableSlots);
        return result;
    }


    /**
     * Lấy lịch sử booking của user (customer)
     */
    public Page<ConsultantBookingResponse> getHistory(
            int customerId,
            Integer consultantId,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime,
            int page,
            int size,
            String sort
    ) {
        Sort.Direction dir = "asc".equalsIgnoreCase(sort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, "bookingDate"));

        Page<ConsultationBooking> pageEnt = bookingRepo.getHistory(
                customerId, consultantId, startDateTime, endDateTime, pageable
        );

        return pageEnt.map(cb -> new ConsultantBookingResponse(
                cb.getBookingId(),
                cb.getConsultant().getFullName(),
                cb.getBookingDate(),
                cb.getConsultant().getConsultantProfile() != null
                        ? cb.getConsultant().getConsultantProfile().getHourlyRate() // Fetch hourlyRate from ConsultantProfile
                        : 0.0,
                cb.getPaymentStatus(),
                cb.getInvoice() != null
                        ? cb.getInvoice().getPaymentMethod()
                        : null,
                cb.getMeetLink(),
                cb.getStatus().name(),
                cb.getConsultant().getUserId(),
                cb.getCustomer().getFullName() // Added customerName
        ));
    }

    @Transactional
    public void updateBookingStatus(Integer bookingId, Integer userId, String status, String role) {
        ConsultationBooking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking không tồn tại"));

        if (!"STAFF".equalsIgnoreCase(role) && !booking.getConsultant().getUserId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền cập nhật trạng thái cho booking này");
        }

        BookingStatus newStatus;
        try {
            newStatus = BookingStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ. Chỉ chấp nhận COMPLETED, CANCELLED hoặc SCHEDULED");
        }

        if (newStatus != BookingStatus.COMPLETED && newStatus != BookingStatus.CANCELLED && newStatus != BookingStatus.SCHEDULED) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ. Chỉ chấp nhận COMPLETED, CANCELLED hoặc SCHEDULED");
        }

        booking.setStatus(newStatus);
        bookingRepo.save(booking);
    }


    public PageResponse<ConsultantBookingResponse> searchBookings(String customerName, String consultantName, LocalDateTime startDate, LocalDateTime endDate, BookingStatus status, Pageable pageable) {
        String statusString = status != null ? status.name() : null;
        Page<ConsultationBooking> bookingsPage = bookingRepo.findByCustomerOrConsultantNameAndDateAndStatus(customerName, consultantName, startDate, endDate, statusString, pageable);

        Page<ConsultantBookingResponse> responsePage = bookingsPage.map(b -> new ConsultantBookingResponse(
                b.getBookingId(),
                b.getConsultant() != null ? b.getConsultant().getFullName() : null,
                b.getBookingDate(),
                b.getInvoice() != null && b.getInvoice().getTotalAmount() != null
                        ? b.getInvoice().getTotalAmount() // Use Double directly
                        : 0.0,
                b.getPaymentStatus(),
                b.getInvoice() != null
                        ? b.getInvoice().getPaymentMethod()
                        : null,
                b.getMeetLink(),
                b.getStatus().name(),
                b.getConsultant() != null ? b.getConsultant().getUserId() : null,
                b.getCustomer() != null ? b.getCustomer().getFullName() : null // Added customerName mapping
        ));
        return PageResponseUtil.mapToPageResponse(responsePage);
    }

    public PageResponse<ConsultantBookingDetailResponse> getPaginatedScheduleForConsultant(Integer consultantId, int page, int size, String sortBy, String direction) {
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        Page<ConsultationBooking> bookingsPage = bookingRepo.findByConsultant(consultantId, pageable);

        Page<ConsultantBookingDetailResponse> responsePage = bookingsPage.map(b -> new ConsultantBookingDetailResponse(
                b.getBookingId(),
                b.getCustomer().getFullName(),
                b.getCustomer().getUserId(),
                b.getBookingDate(),
                b.getStatus().name(),
                b.getPaymentStatus(),
                b.getInvoice() != null ? b.getInvoice().getPaymentMethod() : null, // Added paymentMethod
                b.getMeetLink()
        ));

        return PageResponseUtil.mapToPageResponse(responsePage);
    }

    // Overload method for backward compatibility
    public PageResponse<ConsultantBookingDetailResponse> getPaginatedScheduleForConsultant(Integer consultantId, int page, int size) {
        return getPaginatedScheduleForConsultant(consultantId, page, size, "bookingDate", "asc");
    }

    public PageResponse<ConsultantBookingDetailResponse> searchConsultantSchedule(Integer consultantId, int page, int size, String status, String customerName, LocalDateTime startDate, LocalDateTime endDate, String sortBy, String direction) {
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<ConsultationBooking> bookingsPage = bookingRepo.findByConsultantAndFilters(
                consultantId, status, customerName, startDate, endDate, pageable);

        Page<ConsultantBookingDetailResponse> responsePage = bookingsPage.map(b -> new ConsultantBookingDetailResponse(
                b.getBookingId(),
                b.getCustomer().getFullName(),
                b.getCustomer().getUserId(),
                b.getBookingDate(),
                b.getStatus().name(),
                b.getPaymentStatus(),
                b.getInvoice() != null ? b.getInvoice().getPaymentMethod() : null, // Added paymentMethod
                b.getMeetLink()
        ));

        return PageResponseUtil.mapToPageResponse(responsePage);
    }

    // Overload method for backward compatibility
    public PageResponse<ConsultantBookingDetailResponse> searchConsultantSchedule(Integer consultantId, int page, int size, String status, String customerName, LocalDateTime startDate, LocalDateTime endDate) {
        return searchConsultantSchedule(consultantId, page, size, status, customerName, startDate, endDate, "bookingDate", "asc");
    }
}
