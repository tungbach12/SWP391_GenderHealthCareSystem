package ForgetPasswordApplication.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserInfoResponse {
    private Integer accountId;
    private String username;
    private String email;
    private String role;
    private String fullName;
}
