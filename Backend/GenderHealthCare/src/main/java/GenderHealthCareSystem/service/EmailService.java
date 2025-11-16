package GenderHealthCareSystem.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    public void sendOtpEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("OTP for Password Reset");
        message.setText("Mã OTP của bạn là: " + otp + " OTP có hiệu lực trong 3 phút.");
        mailSender.send(message);
    }

    public void sendFertilityNotificationEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        try {
            logger.info("[DEBUG] Attempting to send email to: {}", to);
            logger.info("[DEBUG] Email subject: {}", subject);
            logger.info("[DEBUG] Email content: {}", text);
            mailSender.send(message);
            logger.info("[DEBUG] Email successfully sent to: {}", to);
        } catch (Exception e) {
            logger.error("[ERROR] Failed to send email to: {}", to, e);
            logger.error("[ERROR] Exception message: {}", e.getMessage());
            logger.error("[ERROR] Cause: {}", e.getCause());
        }
    }
    public void sendBookingConfirmationEmail(String to, String serviceName,
                                             String dateTime) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Xác nhận đặt lịch dịch vụ STIs tại Gender Health Care System");
        String text = "Kính gửi " + "quý khách" + ",\n\n" +
                "Cảm ơn bạn đã đặt lịch dịch vụ tại Gender Health Care System. " +
                "Đơn đặt lịch của bạn đã được tạo thành công.\n\n" +
                "Chi tiết đặt lịch:\n" +
                "- Dịch vụ: " + serviceName + "\n" +
                "- Thời gian: " + dateTime + "\n\n" +
                "Nhân viên của chúng tôi sẽ xác nhận đơn đặt lịch của bạn trong thời gian sớm nhất. " +
                "Bạn có thể theo dõi trạng thái đơn đặt lịch trong trang cá nhân của mình.\n\n" +
                "Trân trọng,\n" +
                "Gender Health Care System";
        message.setText(text);
        try {
            logger.info("[DEBUG] Gửi email xác nhận đặt lịch tới: {}", to);
            mailSender.send(message);
            logger.info("[DEBUG] Email xác nhận đặt lịch đã được gửi thành công tới: {}", to);
        } catch (Exception e) {
            logger.error("[ERROR] Không thể gửi email xác nhận đặt lịch tới: {}", to, e);
        }
    }

    public void sendTestResultsReadyEmail(String to, String serviceName,
                                          String bookingId) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Kết quả xét nghiệm STIs của bạn đã sẵn sàng");
        String text = "Kính gửi " + "quý khách" + ",\n\n" +
                "Chúng tôi trân trọng thông báo rằng kết quả xét nghiệm STIs của bạn đã sẵn sàng.\n\n" +
                "Chi tiết:\n" +
                "- Mã đặt lịch: " + bookingId + "\n" +
                "- Dịch vụ: " + serviceName + "\n\n" +
                "Bạn có thể xem kết quả xét nghiệm của mình bằng cách đăng nhập vào tài khoản và truy cập mục 'Lịch sử đặt lịch' " +
                "Lưu ý: Vui lòng đăng nhập để xem kết quả xét nghiệm. Thông tin sức khỏe của bạn được bảo mật nghiêm ngặt.\n\n" +
                "Nếu bạn có bất kỳ thắc mắc nào về kết quả xét nghiệm hoặc cần tư vấn thêm, vui lòng liên hệ với đội ngũ y tế của chúng tôi " +
                "hoặc đặt lịch tư vấn với bác sĩ.\n\n" +
                "Trân trọng,\n" +
                "Gender Health Care System";
        message.setText(text);
        try {
            logger.info("[DEBUG] Gửi email thông báo kết quả xét nghiệm tới: {}", to);
            mailSender.send(message);
            logger.info("[DEBUG] Email thông báo kết quả xét nghiệm đã được gửi thành công tới: {}", to);
        } catch (Exception e) {
            logger.error("[ERROR] Không thể gửi email thông báo kết quả xét nghiệm tới: {}", to, e);
        }
    }
}
