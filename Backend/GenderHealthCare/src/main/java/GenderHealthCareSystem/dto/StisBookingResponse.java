package GenderHealthCareSystem.dto;

import GenderHealthCareSystem.enums.StisBookingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StisBookingResponse {
    private Integer bookingId;
    private Integer customerId;
    private String customerName;
    private Integer serviceId;
    private String serviceName;
    private BigDecimal servicePrice;
    private Integer discount;
    private LocalDate bookingDate;
    private LocalTime bookingTimeStart;
    private LocalTime bookingTimeEnd;
    private Integer stisInvoiceID;
    private StisBookingStatus status;
    private String resultStatus;
    private String paymentStatus;
    private String paymentMethod;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resultedAt;
}
