package GenderHealthCareSystem.service;

import GenderHealthCareSystem.dto.DayInfo;
import GenderHealthCareSystem.enums.DayType;
import GenderHealthCareSystem.dto.MenstrualCalendarResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MenstrualCalendarService {

    @Autowired
    private EmailService emailService;

    /**
     * Dự đoán nhiều chu kỳ sinh sản bắt đầu từ startDate. Trả về danh sách các
     * ngày để hiển thị lịch theo nhiều tháng.
     */
    public MenstrualCalendarResponse buildCalendar(
            Integer cycleId,
            LocalDate startDate,
            int cycleLength,
            int menstruationDays
    ) {
        List<DayInfo> days = new ArrayList<>();

        int numberOfCycles = 6; // Dự đoán 6 chu kỳ liên tiếp
        for (int cycle = 0; cycle < numberOfCycles; cycle++) {
            LocalDate cycleStart = startDate.plusDays(cycle * cycleLength);
            LocalDate ovulationDate = cycleStart.plusDays(cycleLength - 14);

            for (int day = 0; day < cycleLength; day++) {
                LocalDate currentDate = cycleStart.plusDays(day);
                DayType type = DayType.NORMAL;

                if (day < menstruationDays) {
                    type = DayType.MENSTRUATION;
                } else {
                    long dist = Math.abs(currentDate.toEpochDay() - ovulationDate.toEpochDay());
                    if (dist <= 1) {
                        type = DayType.HIGH_FERTILITY;
                    } else if (dist <= 3) {
                        type = DayType.MEDIUM_FERTILITY;
                    }
                }

                days.add(new DayInfo(currentDate, type));
            }
        }

        return new MenstrualCalendarResponse(
                cycleId,
                startDate,
                cycleLength,
                days
        );
    }



}
