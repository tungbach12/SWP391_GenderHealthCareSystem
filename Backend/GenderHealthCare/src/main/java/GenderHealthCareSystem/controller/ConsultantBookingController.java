package GenderHealthCareSystem.controller;

import GenderHealthCareSystem.dto.*;
import GenderHealthCareSystem.enums.BookingStatus;
import GenderHealthCareSystem.model.Invoice;
import GenderHealthCareSystem.service.ConsultantBookingService;
import GenderHealthCareSystem.service.ConsultantInvoiceService;
import GenderHealthCareSystem.util.PageResponseUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;


import java.time.LocalDateTime;



@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class ConsultantBookingController {

    private final ConsultantBookingService bookingService;
    private final ConsultantInvoiceService invoiceService;

    @PostMapping
    // API to create a new booking
    public ResponseEntity<ApiResponse<ConsultantBookingResponse>> createBooking(
            @RequestBody @Valid ConsultantBookingRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        // Lấy customerId từ token JWT, không dùng giá trị từ client
        int customerId = Integer.parseInt(jwt.getClaimAsString("userID"));
        ConsultantBookingResponse response = bookingService.createBooking(request,customerId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }



    // 3. Consultant: view all bookings with customer info
    @GetMapping("/consultant/schedule")
    // API for consultants to view their schedule
    public ResponseEntity<ApiResponse<PageResponse<ConsultantBookingDetailResponse>>> getConsultantSchedule(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "bookingDate") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @AuthenticationPrincipal Jwt jwt) {
        int consultantId = Integer.parseInt(jwt.getClaimAsString("userID"));
        String role = jwt.getClaimAsString("role");
        if (!"CONSULTANT".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Bạn không có quyền truy cập lịch tư vấn."));
        }
        PageResponse<ConsultantBookingDetailResponse> schedule = bookingService.getPaginatedScheduleForConsultant(consultantId, page, size, sortBy, direction);
        return ResponseEntity.ok(ApiResponse.success(schedule));
    }

        @GetMapping("/consultant/schedule/search")
    // API for consultants to search their schedule with filters
    public ResponseEntity<ApiResponse<PageResponse<ConsultantBookingDetailResponse>>> searchConsultantSchedule(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "bookingDate") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @AuthenticationPrincipal Jwt jwt) {
        int consultantId = Integer.parseInt(jwt.getClaimAsString("userID"));
        String role = jwt.getClaimAsString("role");
        if (!"CONSULTANT".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Bạn không có quyền truy cập lịch tư vấn."));
        }

        LocalDateTime start = startDate != null && !startDate.isEmpty() ? LocalDateTime.parse(startDate) : null;
        LocalDateTime end = endDate != null && !endDate.isEmpty() ? LocalDateTime.parse(endDate) : null;

        PageResponse<ConsultantBookingDetailResponse> schedule = bookingService.searchConsultantSchedule(
                consultantId, page, size, status, customerName, start, end, sortBy, direction);
        return ResponseEntity.ok(ApiResponse.success(schedule));
    }


    @GetMapping("/calendar/{consultantId}")
    // API to get the calendar of a specific consultant
    public ResponseEntity<?> getConsultantCalendar(@PathVariable Integer consultantId) {
        var calendar = bookingService.getConsultantCalendar(consultantId);
        return ResponseEntity.ok(ApiResponse.success(calendar));
    }

    @GetMapping("/history")
    // API for customers to view their booking history
    public ResponseEntity<ApiResponse<PageResponse<ConsultantBookingResponse>>> getBookingHistory(
            @RequestParam(required = false) Integer consultantId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "desc") String sort,
            @AuthenticationPrincipal Jwt jwt
    ) {
        int customerId = Integer.parseInt(jwt.getClaimAsString("userID"));
        LocalDateTime start = startDate != null && !startDate.isEmpty() ? LocalDateTime.parse(startDate) : null;
        LocalDateTime end = endDate != null && !endDate.isEmpty() ? LocalDateTime.parse(endDate) : null;

        Page<ConsultantBookingResponse> history = bookingService.getHistory(
                customerId, consultantId, start, end, page, size, sort
        );

        return ResponseEntity.ok(
                new ApiResponse<>(
                        HttpStatus.OK,
                        "Fetched booking history",
                        PageResponseUtil.mapToPageResponse(history),
                        null
                )
        );
    }
    @PutMapping("/cancel/{bookingId}")
    @PreAuthorize("hasRole('Customer')")
    // API for customers to cancel a booking
    public ResponseEntity<RefundResponse> cancelBooking(
            @PathVariable Integer bookingId,
            @AuthenticationPrincipal Jwt jwt) {

        Integer customerId = ((Number) jwt.getClaim("userID")).intValue();
        String msg = invoiceService.requestRefund(bookingId, customerId);
        Double amount = invoiceService.getInvoiceByBooking(bookingId)
                .map(Invoice::getRefundAmount)
                .orElse(0.0);
        String status = invoiceService.getInvoiceByBooking(bookingId)
                .map(Invoice::getRefundStatus)
                .orElse("UNKNOWN");

        return ResponseEntity.ok(new RefundResponse(msg, amount, status));
    }

    @PutMapping("/reschedule")
    @PreAuthorize("hasRole('Customer')")
    // API for customers to reschedule a booking
    public ResponseEntity<ApiResponse<String>> rescheduleBooking(
            @RequestBody @Valid RescheduleRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            Integer customerId = Integer.parseInt(jwt.getClaimAsString("userID"));
            String result = invoiceService.rescheduleBooking(
                    request.getBookingId(),
                    customerId,
                    request.getNewBookingDate()
            );
            return ResponseEntity.ok(ApiResponse.success(result));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(ex.getMessage()));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Có lỗi xảy ra khi thay đổi lịch hẹn"));
        }
    }


    @PutMapping("/update-meeting-link/{bookingId}")
    @PreAuthorize("hasRole('Staff')")
    // API for staff to update the meeting link of a booking
    public ResponseEntity<?> updateMeetingLink(
            @PathVariable Integer bookingId,
            @RequestParam String meetingLink) {
        try {
            invoiceService.updateMeetingLink(bookingId, meetingLink);
            return ResponseEntity.ok("Meeting link updated successfully.");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body("Error: " + ex.getMessage());
        }
    }

    @PutMapping("/{bookingId}/status")
    @PreAuthorize("hasAnyRole('Consultant','Staff')")
    // API for consultants or staff to update the status of a booking
    public ResponseEntity<ApiResponse<String>> updateBookingStatus(
            @PathVariable Integer bookingId,
            @RequestParam String status,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            int userId = Integer.parseInt(jwt.getClaimAsString("userID"));
            String role = jwt.getClaimAsString("role");
            bookingService.updateBookingStatus(bookingId, userId, status, role);
            return ResponseEntity.ok(ApiResponse.success("Booking status updated successfully."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ApiResponse.error("An error occurred while updating the booking status."));
        }
    }



    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('Manager', 'Admin', 'Staff')")
    // API for managers, admins, or staff to search bookings
    public ResponseEntity<PageResponse<ConsultantBookingResponse>> searchBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "bookingId") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) String consultantName,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate,
            @RequestParam(required = false) String status) {

        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        BookingStatus bookingStatus = (status != null && !status.isEmpty()) ? BookingStatus.valueOf(status.toUpperCase()) : null;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        PageResponse<ConsultantBookingResponse> bookings = bookingService.searchBookings(customerName, consultantName, startDate, endDate, bookingStatus, pageable);

        return ResponseEntity.ok(bookings);
    }
}

