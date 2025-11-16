package GenderHealthCareSystem.service;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import GenderHealthCareSystem.dto.MenstrualCycleRequest;
import GenderHealthCareSystem.dto.MenstrualCycleResponse;
import GenderHealthCareSystem.model.MenstrualCycle;
import GenderHealthCareSystem.model.Users;
import GenderHealthCareSystem.repository.MenstrualCycleRepository;
import GenderHealthCareSystem.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MenstrualCycleService {

    @Autowired
    private MenstrualCycleRepository menstrualCycleRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Tạo mới chu kỳ kinh nguyệt và lưu vào DB
     */
    public MenstrualCycleResponse createMenstrualCycle(MenstrualCycleRequest request, Integer userId) {
        log.info("Creating cycle for userID = {}, startDate = {}, cycleLength = {}", userId, request.getStartDate(), request.getCycleLength());

        // 1. Lấy thông tin người dùng
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with ID = {}", userId);
                    return new RuntimeException("User not found with ID = " + userId);
                });

        // 2. Tính endDate (nếu chưa truyền từ frontend)
        LocalDate startDate = request.getStartDate();
        int periodLength = 5; // Mặc định số ngày hành kinh nếu không có
        if (request.getEndDate() != null) {
            periodLength = (int) (request.getEndDate().toEpochDay() - request.getStartDate().toEpochDay()) + 1;
        }
        LocalDate endDate = startDate.plusDays(periodLength - 1);

        // 3. Tạo và l��u chu kỳ
        MenstrualCycle cycle = new MenstrualCycle();
        cycle.setCustomer(user);
        cycle.setStartDate(startDate);
        cycle.setEndDate(endDate);
        cycle.setCycleLength(request.getCycleLength());
        cycle.setNote(request.getNote());
        cycle.setCreatedAt(LocalDateTime.now());

        MenstrualCycle savedCycle = menstrualCycleRepository.save(cycle);
        log.info("Saved cycle ID = {} for userID = {}", savedCycle.getCycleId(), userId);

        // 4. Trả response
        return new MenstrualCycleResponse(
                savedCycle.getCycleId(),
                user.getUserId(),
                savedCycle.getStartDate(),
                savedCycle.getEndDate(),
                savedCycle.getCycleLength(),
                savedCycle.getNote(),
                savedCycle.getCreatedAt()
        );
    }

    /**
     * Lấy chu kỳ gần nhất của người dùng
     */
    public MenstrualCycleResponse getLatestCycleForUser(Integer userId) {
        MenstrualCycle cycle = menstrualCycleRepository
                .findFirstByCustomerUserIdOrderByUpdatedAtDesc(userId)
                .orElseThrow(() -> new RuntimeException("No cycle found for user " + userId));

        return new MenstrualCycleResponse(
                cycle.getCycleId(),
                userId,
                cycle.getStartDate(),
                cycle.getEndDate(),
                cycle.getCycleLength(),
                cycle.getNote(),
                cycle.getCreatedAt()
        );
    }

    /**
     * Cập nhật chu kỳ kinh nguyệt
     */
    public MenstrualCycleResponse updateMenstrualCycle(MenstrualCycleRequest request, Integer userId) {
        log.info("Updating cycle for userID = {}, startDate = {}, endDate = {}", userId, request.getStartDate(), request.getEndDate());

        // 1. Lấy thông tin người dùng
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found with ID = {}", userId);
                    return new RuntimeException("User not found with ID = " + userId);
                });

        // 2. Lấy chu kỳ hiện tại
        MenstrualCycle currentCycle = menstrualCycleRepository
                .findFirstByCustomerUserIdOrderByUpdatedAtDesc(userId)
                .orElseThrow(() -> new RuntimeException("No cycle found for user " + userId));

        // Update the current cycle with new data
        currentCycle.setStartDate(request.getStartDate());
        currentCycle.setEndDate(request.getEndDate());
        currentCycle.setCycleLength(request.getCycleLength());
        currentCycle.setNote(request.getNote());
        currentCycle.setUpdatedAt(LocalDateTime.now());
        currentCycle.setCreatedAt(LocalDateTime.now());

        MenstrualCycle updatedCycle = menstrualCycleRepository.save(currentCycle);
        log.info("Updated cycle ID = {} for userID = {}", updatedCycle.getCycleId(), userId);

        // Return the updated cycle response
        return new MenstrualCycleResponse(
                updatedCycle.getCycleId(),
                user.getUserId(),
                updatedCycle.getStartDate(),
                updatedCycle.getEndDate(),
                updatedCycle.getCycleLength(),
                updatedCycle.getNote(),
                updatedCycle.getCreatedAt()
        );
    }
}
