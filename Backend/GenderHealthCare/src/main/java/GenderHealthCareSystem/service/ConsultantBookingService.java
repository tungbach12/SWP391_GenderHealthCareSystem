package GenderHealthCareSystem.service;


import GenderHealthCareSystem.dto.ConsultantBookingDetailResponse;
import GenderHealthCareSystem.dto.ConsultantBookingRequest;
import GenderHealthCareSystem.dto.ConsultantBookingResponse;
import GenderHealthCareSystem.model.ConsultationBooking;
import GenderHealthCareSystem.model.Users;
import GenderHealthCareSystem.repository.ConsultantProfileRepository;
import GenderHealthCareSystem.repository.ConsultationBookingRepository;
import GenderHealthCareSystem.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsultantBookingService {

    private final ConsultationBookingRepository bookingRepo;
    private final UserRepository userRepository;


    private final GoogleCalendarService googleCalendarService; // Inject GoogleCalendarService

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
        booking.setStatus("PENDING");
        booking.setPaymentStatus("UNPAID");
        booking.setCreatedAt(LocalDateTime.now());

        booking = bookingRepo.save(booking);

        return new ConsultantBookingResponse(
                booking.getBookingId(),
                booking.getConsultant().getFullName(),
                booking.getBookingDate(),
                null,
                booking.getPaymentStatus(),
                null,
                booking.getMeetLink()
        );
    }



    public List<ConsultantBookingResponse> getBookingHistory(Integer customerId) {
        List<ConsultationBooking> bookings = bookingRepo.findByCustomer_UserId(customerId);
        return bookings.stream().map(b -> new ConsultantBookingResponse(
                b.getBookingId(),
                b.getConsultant().getFullName(),
                b.getBookingDate(),
                b.getInvoice() != null ? new BigDecimal(b.getInvoice().getTotalAmount()) : null,
                b.getPaymentStatus(),
                b.getInvoice() != null ? b.getInvoice().getPaymentMethod() : null,
                b.getMeetLink()
        )).collect(Collectors.toList());
    }



    /** Consultant view: full booking details including customer name and contact **/
    public List<ConsultantBookingDetailResponse> getScheduleForConsultant(Integer consultantId) {
        Users consultant = userRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException("Consultant không tồn tại"));
        List<ConsultationBooking> bookings = bookingRepo.findByConsultant(consultant);
        return bookings.stream().map(b -> new ConsultantBookingDetailResponse(
                b.getBookingId(),
                b.getCustomer().getFullName(),
                b.getCustomer().getUserId(),
                b.getBookingDate(),
                b.getStatus(),
                b.getPaymentStatus(),
                b.getMeetLink()
        )).collect(Collectors.toList());
    }

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
                cb.getInvoice() != null
                        ? BigDecimal.valueOf(cb.getInvoice().getTotalAmount())
                        : BigDecimal.ZERO,
                cb.getPaymentStatus(),
                cb.getInvoice() != null
                        ? cb.getInvoice().getPaymentMethod()
                        : null,
                cb.getMeetLink()
        ));
    }


}
