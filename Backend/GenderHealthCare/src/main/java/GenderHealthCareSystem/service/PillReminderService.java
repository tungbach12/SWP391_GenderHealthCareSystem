package GenderHealthCareSystem.service;

import GenderHealthCareSystem.model.Account;
import GenderHealthCareSystem.model.Pills;
import GenderHealthCareSystem.repository.AccountRepository;
import GenderHealthCareSystem.repository.PillRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PillReminderService {
    private final PillRepository pillRepository;
    private final AccountRepository accountRepository;
    private final JavaMailSender mailSender;

    @Transactional
    public void notifyIfLowStockAndAskToContinue() {
        LocalDate today = LocalDate.now();
        List<Pills> activePills = pillRepository.findByIsActiveTrue();

        for (Pills pill : activePills) {
            long daysLeft = ChronoUnit.DAYS.between(today, pill.getStartDate().plusDays(Integer.parseInt(pill.getPillType())));

            if (daysLeft == 3) { // Gửi thông báo nếu còn 3 ngày
                Optional<Account> optAcct = accountRepository.findByUsers_UserId(pill.getCustomer().getUserId());

                if (optAcct.isPresent()) {
                    String email = optAcct.get().getEmail();
                    SimpleMailMessage msg = new SimpleMailMessage();
                    msg.setTo(email);
                    msg.setSubject("Thông báo: Thuốc sắp hết, bạn có muốn tiếp tục?");
                    msg.setText(
                            "Chào " + pill.getCustomer().getFullName() + ",\n\n" +
                                    "Thuốc của bạn sắp hết. Bạn có muốn tiếp tục uống thuốc không? Nếu có, vui lòng tạo lịch mới."
                    );

                    try {
                        mailSender.send(msg);
                        System.out.println(" Đã gửi thông báo hỏi tiếp tục uống thuốc đến: " + email);
                    } catch (Exception e) {
                        System.out.println(" Gửi thông báo thất bại: " + e.getMessage());
                    }
                }
            }
        }
    }
}
