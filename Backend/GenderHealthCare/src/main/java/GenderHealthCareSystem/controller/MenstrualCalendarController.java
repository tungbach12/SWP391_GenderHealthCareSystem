package GenderHealthCareSystem.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import GenderHealthCareSystem.dto.MenstrualCalendarResponse;
import GenderHealthCareSystem.service.MenstrualCalendarService;
import GenderHealthCareSystem.service.MenstrualCycleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/menstrual/calendar")
@RequiredArgsConstructor
@Slf4j
public class MenstrualCalendarController {

    private final MenstrualCycleService cycleService;
    private final MenstrualCalendarService calendarService;

    @GetMapping("/me")
    // API to get the menstrual calendar of the logged-in user
    public ResponseEntity<?> getMyCalendar(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null || jwt.getClaimAsString("userID") == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing or invalid JWT");
        }

        int userId;
        try {
            userId = Integer.parseInt(jwt.getClaimAsString("userID"));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Invalid userID format");
        }

        // Retrieve the latest updated cycle for the user
        var cycle = cycleService.getLatestCycleForUser(userId);

        // Calculate menstruation days based on the latest cycle
        int menstruationDays = (int) (cycle.getEndDate().toEpochDay() - cycle.getStartDate().toEpochDay()) + 1;

        // Build the calendar based on the latest cycle
        MenstrualCalendarResponse cal = calendarService.buildCalendar(
                cycle.getCycleId(),
                cycle.getStartDate(),
                cycle.getCycleLength(),
                menstruationDays
        );

        return ResponseEntity.ok(cal);
    }
}

