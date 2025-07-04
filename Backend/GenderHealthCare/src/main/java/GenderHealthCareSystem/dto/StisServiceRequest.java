package GenderHealthCareSystem.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class StisServiceRequest {
    private String serviceName;
    private String description;
    private BigDecimal price;
    private String duration;
    private String tests;
    private String type;
    private Integer maxBookingsPerSlot;
    private Integer discount;
    private String status;
}
