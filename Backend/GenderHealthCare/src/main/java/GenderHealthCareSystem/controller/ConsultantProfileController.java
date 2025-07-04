package GenderHealthCareSystem.controller;

import GenderHealthCareSystem.dto.ConsultantProfileResponse;
import GenderHealthCareSystem.dto.ConsultantSearchRequest;
import GenderHealthCareSystem.model.ConsultantProfile;
import GenderHealthCareSystem.dto.ConsultantProfileRequest;
import GenderHealthCareSystem.service.ConsultantProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

@RestController
@RequestMapping("/api/consultant/profile")
public class ConsultantProfileController {

    private final ConsultantProfileService service;

    public ConsultantProfileController(ConsultantProfileService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('Consultant')")
    public ResponseEntity<?> create(@RequestBody ConsultantProfileRequest req,
                                    @AuthenticationPrincipal Jwt jwt) {
        Integer consultantId = ((Number) jwt.getClaim("userID")).intValue();
        return ResponseEntity.ok(service.create(consultantId, req));
    }

    @PutMapping
    @PreAuthorize("hasRole('Consultant')")
    public ResponseEntity<?> update(@RequestBody ConsultantProfileRequest req,
                                    @AuthenticationPrincipal Jwt jwt) {
        Integer consultantId = ((Number) jwt.getClaim("userID")).intValue();
            return ResponseEntity.ok(service.update(consultantId, req));
    }

    @DeleteMapping
    @PreAuthorize("hasRole('Consultant')")
    public ResponseEntity<?> delete(@AuthenticationPrincipal Jwt jwt) {
        Integer consultantId = ((Number) jwt.getClaim("userID")).intValue();
        service.delete(consultantId);
        return ResponseEntity.ok("Deleted");
    }

    @GetMapping
    public ResponseEntity<?> get(@AuthenticationPrincipal Jwt jwt) {
        Integer consultantId = ((Number) jwt.getClaim("userID")).intValue();
        return ResponseEntity.ok(service.get(consultantId));
    }

        @GetMapping("/all")
        @PreAuthorize("hasAnyRole('Customer', 'Manager')")
        public ResponseEntity<?> getAll() {
            return ResponseEntity.ok(service.getAllConsultants());
        }

        @GetMapping("/{id}")
    @PreAuthorize("hasRole('Customer')")
    public ResponseEntity<?> getConsultantProfile(@PathVariable Integer id) {
        try {
            var profile = service.get(id);
            return ResponseEntity.ok(profile);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body("Error: " + ex.getMessage());
        }
    }

    @PutMapping("/{id}/employment-status")
    @PreAuthorize("hasRole('Manager')")
    public ResponseEntity<?> updateEmploymentStatus(@PathVariable Integer id, @RequestParam Boolean employmentStatus) {
        try {
            String result = service.updateEmploymentStatus(id, employmentStatus);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body("Error: " + ex.getMessage());
        }
    }

    @PutMapping("/{id}/hourly-rate")
    @PreAuthorize("hasRole('Manager')")
    public ResponseEntity<?> updateHourlyRate(@PathVariable Integer id, @RequestParam Double hourlyRate) {
        try {
            String result = service.updateHourlyRate(id, hourlyRate);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body("Error: " + ex.getMessage());
        }
    }


    @PostMapping("/search")
    @PreAuthorize("hasRole('Customer')")
    public ResponseEntity<List<ConsultantProfileResponse>> search(@RequestBody ConsultantSearchRequest req) {
        List<ConsultantProfileResponse> results = service.searchConsultants(req);
        return ResponseEntity.ok(results);
    }


}
