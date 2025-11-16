package GenderHealthCareSystem.controller;

import GenderHealthCareSystem.dto.ApiResponse;
import GenderHealthCareSystem.dto.PageResponse;
import GenderHealthCareSystem.dto.StisBookingRequest;
import GenderHealthCareSystem.dto.StisBookingResponse;
import GenderHealthCareSystem.model.StisBooking;
import GenderHealthCareSystem.enums.StisBookingStatus;
import GenderHealthCareSystem.service.EmailService;
import GenderHealthCareSystem.service.StisBookingService;
import GenderHealthCareSystem.util.PageResponseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Optional;

import static GenderHealthCareSystem.util.PageResponseUtil.mapToPageResponse;

@RestController
@RequestMapping("/api/stis-bookings")
public class StisBookingController {

    @Autowired
    private StisBookingService stisBookingService;
    @Autowired
    private EmailService emailService;
    private PageResponseUtil pageResponseUtil;


    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<StisBookingResponse>>> SearchBooking(@RequestParam(required = false) String name,
                                                                                        @RequestParam(required = false) Integer serviceId,
                                                                                        @RequestParam(required = false) String status,
                                                                                        @RequestParam(required = false) String startDate,
                                                                                        @RequestParam(required = false) String endDate,
                                                                                        @RequestParam(defaultValue = "0") int page,
                                                                                        @RequestParam(defaultValue = "5") int size,
                                                                                        @RequestParam(defaultValue = "desc") String sort) {
        StisBookingStatus statusValue = null;

        LocalDateTime startDateTime = null;
        LocalDateTime endDateTime = null;

        if (status != null && !status.isBlank()) {
            statusValue = StisBookingStatus.valueOf(status.toUpperCase());
        }
        if (startDate != null && !startDate.isEmpty()) {
            startDateTime = LocalDateTime.parse(startDate);
        }

        if (endDate != null && !endDate.isEmpty()) {
            endDateTime = LocalDateTime.parse(endDate);
        }
        Page<StisBookingResponse> bookings = stisBookingService.findStisBooking(name, serviceId, statusValue, startDateTime, endDateTime, page, size, sort);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Fetched all bookings", mapToPageResponse(bookings), null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StisBookingResponse>> getBookingById(@PathVariable Integer id) {
        Optional<StisBookingResponse> booking = stisBookingService.getBookingById(id);
        if (booking.isPresent()) {
            return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Booking found", booking.get(), null));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(HttpStatus.NOT_FOUND, "Booking not found", null, "NOT_FOUND"));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<PageResponse<StisBookingResponse>>> getBookingHistoryByCustomer(@RequestParam(required = false) Integer serviceId,
                                                                                                      @RequestParam(required = false) String status,
                                                                                                      @RequestParam(required = false) String startDate,
                                                                                                      @RequestParam(required = false) String endDate,
                                                                                                      @RequestParam(defaultValue = "0") int page,
                                                                                                      @RequestParam(defaultValue = "5") int size,
                                                                                                      @RequestParam(defaultValue = "desc") String sort,
                                                                                                      @AuthenticationPrincipal Jwt jwt) {
        // Fetch booking history for a specific customer
        int customerId = Integer.parseInt(jwt.getClaimAsString("userID"));
        StisBookingStatus statusValue = null;
        LocalDateTime startDateTime = null;
        LocalDateTime endDateTime = null;

        if (status != null && !status.isBlank()) {
            statusValue = StisBookingStatus.valueOf(status.toUpperCase());
        }

        if (startDate != null && !startDate.isEmpty()) {
            startDateTime = LocalDateTime.parse(startDate);
        }

        if (endDate != null && !endDate.isEmpty()) {
            endDateTime = LocalDateTime.parse(endDate);
        }
        Page<StisBookingResponse> bookingHistory = stisBookingService.GetHistory(customerId, serviceId, statusValue,startDateTime,endDateTime, page, size, sort);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Fetched booking history", mapToPageResponse(bookingHistory), null));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<?>> createBooking(@RequestBody StisBookingRequest booking, @AuthenticationPrincipal Jwt jwt) {
        booking.setCustomerId(Integer.parseInt(jwt.getClaimAsString("userID")));
        String email = jwt.getClaimAsString("email");
        StisBookingResponse createdBooking = stisBookingService.createBooking(booking);
        emailService.sendBookingConfirmationEmail(email, createdBooking.getServiceName(), LocalDateTime.now().toString());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(HttpStatus.CREATED, "Booking created", createdBooking, null));

    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StisBooking>> updateBooking(@PathVariable Integer id, @RequestBody StisBookingRequest booking) {
        StisBooking updatedBooking = stisBookingService.updateBooking(booking, id);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Booking updated", updatedBooking, null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBooking(@PathVariable Integer id) {
        stisBookingService.deleteBooking(id);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Booking deleted", null, null));
    }

    @PutMapping("/{id}/mark-confirmed")
    public ResponseEntity<ApiResponse<Void>> markBookingAsConfirmed(@PathVariable Integer id) {
        stisBookingService.markBookingAsConfirmed(id);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Booking marked as confirmed", null, null));
    }

    @PutMapping("/{id}/mark-cancelled")
    public ResponseEntity<ApiResponse<Void>> markBookingAsCancelled(@PathVariable Integer id) {
        stisBookingService.markBookingAsCancelled(id);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Booking marked as cancelled", null, null));
    }

    @PutMapping("/{id}/mark-completed")
    public ResponseEntity<ApiResponse<Void>> markBookingAsCompleted(@PathVariable Integer id) {
        stisBookingService.markBookingAsCompleted(id);
        StisBooking booking = stisBookingService.getBookingByID(id);
        emailService.sendTestResultsReadyEmail(booking.getCustomer().getAccount().getEmail(), booking.getStisService().getServiceName(), id.toString());
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Booking marked as done", null, null));
    }

    @PutMapping("/{id}/mark-no-show")
    public ResponseEntity<ApiResponse<Void>> markBookingAsNoShow(@PathVariable Integer id) {
        stisBookingService.markBookingAsNoShow(id);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Booking marked as no-show", null, null));
    }

    @PutMapping("/{id}/mark-denied")
    public ResponseEntity<ApiResponse<Void>> markBookingAsDenied(@PathVariable Integer id) {
        stisBookingService.markBookingAsDenied(id);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Booking marked as denied", null, null));
    }
    @PutMapping("/{id}/mark-pending-test-result")
    public ResponseEntity<ApiResponse<Void>> markBookingAsPendingTestResult(@PathVariable Integer id) {
        stisBookingService.markBookingAsPendingTestResult(id);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Booking marked as pending test result", null, null));
    }

    @GetMapping("/check-limit")
    public ResponseEntity<ApiResponse<Boolean>> checkBookingLimit(@RequestParam LocalDateTime bookingDateTime,
                                                                  @RequestParam Integer serviceId) {
        boolean isExceeded = stisBookingService.isBookingLimitExceeded(serviceId, bookingDateTime);
        if (isExceeded) {
            return ResponseEntity.status(HttpStatus.OK)
                    .body(new ApiResponse<>(HttpStatus.OK, "Booking limit exceeded for this service", isExceeded, null));
        } else {
            return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Booking limit is within allowed range", isExceeded, null));
        }
    }
    @PutMapping("/{id}/resulted-at")
    public ResponseEntity<ApiResponse<Void>> markBookingAsResultedAt(@PathVariable Integer id) {
        stisBookingService.resultedTime(id);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "cập nhật thời gian có kết quả thành công", null, null));
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<ApiResponse<StisBookingResponse>> rescheduleBooking(
            @PathVariable Integer id,
            @RequestParam LocalDate newDate,
            @RequestParam LocalTime newTime,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            // Verify the user owns this booking or is admin/staff
            StisBooking booking = stisBookingService.getBookingByID(id);
            Integer userId = Integer.parseInt(jwt.getClaimAsString("userID"));
            String role = jwt.getClaimAsString("role");

            // Allow only if user owns the booking or is admin/staff
            if (!booking.getCustomer().getUserId().equals(userId) &&
                    !"ADMIN".equals(role) && !"STAFF".equals(role)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ApiResponse<>(HttpStatus.FORBIDDEN, "You are not authorized to reschedule this booking", null, "FORBIDDEN"));
            }

            // Perform rescheduling
            StisBookingResponse rescheduledBooking = stisBookingService.rescheduleBooking(id, newDate, newTime);

            // Send email notification if needed
            String email = booking.getCustomer().getAccount().getEmail();
            emailService.sendBookingConfirmationEmail(email, booking.getStisService().getServiceName(),
                    "Lịch hẹn của bạn đã được dời đến " + newDate + " " + newTime);

            return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Booking rescheduled successfully", rescheduledBooking, null));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(HttpStatus.BAD_REQUEST, ex.getMessage(), null, "BAD_REQUEST"));
        }
    }

}
