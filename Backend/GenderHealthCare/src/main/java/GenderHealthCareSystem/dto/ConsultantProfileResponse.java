package GenderHealthCareSystem.dto;

import lombok.Data;
import java.util.List;

@Data
public class ConsultantProfileResponse {
    private String jobTitle;
    private String introduction;
    private String specialization;
    private String languages;
    private Integer experienceYears;
    private Double hourlyRate;
    private String location;
    private Boolean isAvailable;
    private Boolean employmentStatus;
    private List<ProfileDetailResponse> details;
    private String fullName; // Added field for consultant's full name
    private String userImageUrl; // Added field for consultant's image url
    private Integer consultantId; // Added field for consultant's ID

}
