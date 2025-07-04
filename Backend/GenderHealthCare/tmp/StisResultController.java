
package GenderHealthCareSystem.controller;

import GenderHealthCareSystem.dto.ApiResponse;
import GenderHealthCareSystem.dto.PageResponse;
import GenderHealthCareSystem.dto.StisResultRequest;
import GenderHealthCareSystem.dto.StisResultResponse;
import GenderHealthCareSystem.model.StisResult;
import GenderHealthCareSystem.service.StisResultService;
import GenderHealthCareSystem.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/stis-results")
@RequiredArgsConstructor
public class StisResultController {

    private final StisResultService stisResultService;
    private final CloudinaryService cloudinaryService;

    @PostMapping(value = "/return/{bookingId}", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE})
    public ResponseEntity<?> returnResult(
            @PathVariable Integer bookingId,
            @ModelAttribute StisResultRequest req) {

        try {
            // Tạo kết quả xét nghiệm
            StisResult result = stisResultService.createResult(bookingId, req);
            
            // Upload file PDF nếu có
            MultipartFile pdfFile = req.getPdfFile();
            if (pdfFile != null && !pdfFile.isEmpty()) {
                String contentType = pdfFile.getContentType();
                if (contentType == null || !contentType.equals("application/pdf")) {
                    return ResponseEntity.badRequest()
                            .body(new ApiResponse<>(HttpStatus.BAD_REQUEST, "Chỉ chấp nhận file PDF", null, "INVALID_FILE_TYPE"));
                }

                try {
                    String pdfUrl = cloudinaryService.uploadFile(pdfFile);
                    result = stisResultService.updateResultPdf(result.getResultId(), pdfUrl);
                } catch (IOException e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(new ApiResponse<>(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi khi upload file: " + e.getMessage(), null, "UPLOAD_ERROR"));
                }
            }

            return ResponseEntity.ok(new ApiResponse<>(HttpStatus.OK, "Tạo kết quả xét nghiệm thành công", stisResultService.mapToResponse(result), null));
        } catch (IllegalStateException | IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(HttpStatus.BAD_REQUEST, ex.getMessage(), null, "BAD_REQUEST"));
        }
    }

    @GetMapping("/by-booking/{bookingId}")
    public ResponseEntity<?> getResultByBooking(@PathVariable Integer bookingId) {
        return stisResultService.getResultByBookingId(bookingId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Không tìm thấy kết quả cho booking này!"));
    }

    @GetMapping("/all")
    public ResponseEntity<PageResponse<StisResultResponse>> getAllResults(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "resultId") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        PageResponse<StisResultResponse> results = stisResultService.getAllResults(pageable);

        return ResponseEntity.ok(results);
    }

    private ResponseEntity<ApiResponse<StisResultResponse>> createErrorResponse(
            HttpStatus status, String message, String errorCode) {
        ApiResponse<StisResultResponse> response = new ApiResponse<>(status, message, null, errorCode);
        return ResponseEntity.status(status).body(response);
    }
}
