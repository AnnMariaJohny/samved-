package io.samved.task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
public interface StudentActionPlanRepository extends JpaRepository<StudentActionPlan,Long> {
    List<StudentActionPlan> findByThroughDateBefore(LocalDate date);
}
