package GenderHealthCareSystem.dto;

import lombok.Data;
import java.util.List;

@Data
public class ConsultantProfileRequest {
    private String jobTitle;
    private String introduction;
    private String specialization;
    private String languages;
    private Integer experienceYears;
    private Double hourlyRate;
    private String location;
    private Boolean isAvailable;
    private Boolean employmentStatus;
    private List<ProfileDetailRequest> details;
    private String fullName;
}




