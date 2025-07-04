package GenderHealthCareSystem.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "Question")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @Column(name = "QuestionID")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer questionId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "CustomerID", referencedColumnName = "UserID")
    private Users customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ConsultantID", referencedColumnName = "UserID")
    private Users consultant;

    @Column(name = "Title", columnDefinition = "NVARCHAR(255)")
    private String title;

    @Column(name = "Content", columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "Answer", columnDefinition = "NVARCHAR(MAX)")
    private String answer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "AnswerBy", referencedColumnName = "UserID")
    private Users answerBy;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt;

    @Column(name = "AnsweredAt")
    private LocalDateTime answeredAt;

    @Column(name = "Status", columnDefinition = "NVARCHAR(20)")
    private String status; // PENDING, ANSWERED, DELETED

    public boolean isAnswered() {
        return answer != null && !answer.trim().isEmpty();
    }
}