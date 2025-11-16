package GenderHealthCareSystem.repository;

import GenderHealthCareSystem.model.MenstrualCycle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MenstrualCycleRepository extends JpaRepository<MenstrualCycle, Integer> {

//Optional<MenstrualCycle> findFirstByCustomerUserIdOrderByStartDateDesc(Integer userId);
    Optional<MenstrualCycle> findFirstByCustomerUserIdOrderByUpdatedAtDesc(Integer userId);


}
