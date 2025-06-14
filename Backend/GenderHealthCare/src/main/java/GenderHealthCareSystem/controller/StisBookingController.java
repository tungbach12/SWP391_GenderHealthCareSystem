package GenderHealthCareSystem.controller;

import GenderHealthCareSystem.dto.ApiResponse;
import GenderHealthCareSystem.dto.PageResponse;
import GenderHealthCareSystem.dto.StisBookingRequest;
import GenderHealthCareSystem.dto.StisBookingResponse;
import GenderHealthCareSystem.model.StisBooking;
import GenderHealthCareSystem.model.StisBookingStatus;
import GenderHealthCareSystem.service.StisBookingService;
import GenderHealthCareSystem.util.PageResponseUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

import static GenderHealthCareSystem.util.PageResponseUtil.mapToPageResponse;

@RestController
@RequestMapping("/api/stis-bookings")
public class StisBookingController {

    @Autowired
    private StisBookingService stisBookingService;
    private PageResponseUtil pageResponseUtil;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<StisBookingResponse>>> SearchBooking(@RequestParam(required = false) String name,
                                                                                        @RequestParam(required = false) Integer serviceId,
                                                                                        @RequestParam(required = false) String status,
                                                                                        @RequestParam(defaultValue = "0") int page,
                                                                                        @RequestParam(defaultValue = "5") int size,
                                                                                        @RequestParam(defaultValue = "desc") String sort) {
        StisBookingStatus statusValue = null;
        if (status != null && !status.isBlank()) {
            statusValue = StisBookingStatus.valueOf(status.toUpperCase());
        }
        Page<StisBookingResponse> bookings = stisBookingService.findStisBooking(name, serviceId, statusValue, page, size, sort);
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
                                                                                                      @RequestParam(defaultValue = "0") int page,
                                                                                                      @RequestParam(defaultValue = "5") int size,
                                                                                                      @RequestParam(defaultValue = "desc") String sort,
                                                                                                      @AuthenticationPrincipal Jwt jwt) {
        // Fetch booking history for a specific customer
        int customerId = Integer.parseInt(jwt.getClaimAsString("userID"));
        StisBookingStatus statusValue = null;
        if (status != null && !status.isBlank()) {
            statusValue = StisBookingStatus.valueOf(status.toUpperCase());
        }
        Page<StisBookingResponse> bookingHistory = stisBookingService.GetHistory(customerId, serviceId, statusValue, page, size, sort);
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Fetched booking history", mapToPageResponse(bookingHistory), null));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StisBooking>> createBooking(@RequestBody StisBookingRequest booking, @AuthenticationPrincipal Jwt jwt) {
        booking.setCustomerId(Integer.parseInt(jwt.getClaimAsString("userID")));
        StisBooking createdBooking = stisBookingService.createBooking(booking);
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
        return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Booking marked as done", null, null));
    }


}




