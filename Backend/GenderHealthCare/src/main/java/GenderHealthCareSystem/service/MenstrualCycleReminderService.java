package GenderHealthCareSystem.service;

import GenderHealthCareSystem.model.Account;
import GenderHealthCareSystem.model.MenstrualCycle;
import GenderHealthCareSystem.repository.AccountRepository;
import GenderHealthCareSystem.repository.MenstrualCycleRepository;
import GenderHealthCareSystem.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MenstrualCycleReminderService {

    private final MenstrualCycleRepository menstrualCycleRepository;
    private final AccountRepository accountRepository;
    private final EmailService emailService;

    @Scheduled(cron = "*/30 * * * * *")
    public void sendDailyFertilityNotifications() {
        System.out.println("[DEBUG] Starting sendDailyFertilityNotifications...");

        List<Account> accounts = accountRepository.findAll();
        System.out.println("[DEBUG] Total accounts: " + accounts.size());
        if (accounts.isEmpty()) {
            System.out.println("[DEBUG] No accounts to process.");
            return;
        }

        LocalDate today = LocalDate.now();
        System.out.println("[DEBUG] Today's date: " + today);

        for (Account account : accounts) {
            Integer userId = account.getUsers().getUserId();
            System.out.println("[DEBUG] Processing user ID: " + userId);

            Optional<MenstrualCycle> cycleOpt =
                    menstrualCycleRepository.findFirstByCustomerUserIdOrderByUpdatedAtDesc(userId);

            if (cycleOpt.isEmpty()) {
                System.out.println("[DEBUG] No cycle found for user ID: " + userId);
                continue;
            }

            MenstrualCycle cycle = cycleOpt.get();
            System.out.println("[DEBUG] Found cycle for user ID: " + userId);

            LocalDate startDate = cycle.getStartDate();
            LocalDate endDate = cycle.getEndDate();
            int cycleLength = cycle.getCycleLength();
            int menstruationDays = (int) (endDate.toEpochDay() - startDate.toEpochDay()) + 1;
            String userEmail = account.getEmail();
            System.out.println("[DEBUG] User email: " + userEmail);

            int numberOfCycles = 6;
            for (int i = 0; i < numberOfCycles; i++) {
                LocalDate cycleStart = startDate.plusDays((long) i * cycleLength);
                LocalDate ovulationDate = cycleStart.plusDays(cycleLength - 14);

                for (int day = menstruationDays; day < cycleLength; day++) {
                    LocalDate currentDate = cycleStart.plusDays(day);
                    long dist = Math.abs(currentDate.toEpochDay() - ovulationDate.toEpochDay());

                    // Xác định loại và nội dung email
                    String type = null, subject = "", content = "";
                    if (dist <= 1) {
                        type = "HIGH";
                        subject = "Thông báo: Giai đoạn khả năng mang thai cao";
                        content = "Bạn sắp bước vào giai đoạn khả năng mang thai cao từ "
                                + currentDate + " đến " + currentDate.plusDays(1);
                    } else if (dist <= 3) {
                        type = "MEDIUM";
                        subject = "Thông báo: Giai đoạn khả năng mang thai trung bình";
                        content = "Bạn sắp bước vào giai đoạn khả năng mang thai trung bình từ "
                                + currentDate + " đến " + currentDate.plusDays(2);
                    } else if (dist <= 5) {
                        type = "LOW";
                        subject = "Thông báo: Giai đoạn khả năng mang thai thấp";
                        content = "Bạn sắp bước vào giai đoạn khả năng mang thai thấp từ "
                                + currentDate + " đến " + currentDate.plusDays(4);
                    }
                    if (type == null) {
                        continue;  // không phải giai đoạn cần gửi
                    }

                    // 1) Nếu chưa từng gửi (two columns null) → gửi luôn
                    boolean neverSent = cycle.getLastNotificationDate() == null
                            || cycle.getLastNotificationType() == null;
                    // 2) Hoặc bắt đầu chu kỳ mới (ngày đầu hoặc 1 ngày sau startDate)
                    boolean newCycleStart = currentDate.equals(startDate)
                            || currentDate.minusDays(1).equals(startDate);
                    // 3) Đã gửi cùng type hôm nay → không gửi
                    boolean sentTodaySameType = today.equals(cycle.getLastNotificationDate())
                            && type.equals(cycle.getLastNotificationType());
                    // 4) Nếu không phải ngày hôm nay hoặc hôm trước → không gửi
                    boolean notRightDay = !(currentDate.equals(today)
                            || currentDate.minusDays(1).equals(today));

                    if ((neverSent || newCycleStart)
                            || (!sentTodaySameType && !notRightDay)) {
                        // gửi mail và cập nhật
                        try {
                            emailService.sendFertilityNotificationEmail(userEmail, subject, content);
                            System.out.println("[DEBUG] Sent " + type + " email to " + userEmail);
                            cycle.setLastNotificationDate(today);
                            cycle.setLastNotificationType(type);
                            menstrualCycleRepository.save(cycle);
                        } catch (Exception e) {
                            System.out.println("[ERROR] Failed to send email to " + userEmail + ": " + e.getMessage());
                        }
                        break;
                    }
                    // nếu không vào bất kỳ trường hợp nào ở trên → tiếp tục vòng ngày
                }
            }
        }
    }
}
