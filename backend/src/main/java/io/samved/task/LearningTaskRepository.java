package io.samved.task;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

public interface LearningTaskRepository extends JpaRepository<LearningTask, Long> {
    List<LearningTask> findByStudentIdOrderByCreatedAtDesc(long studentId);
    Optional<LearningTask> findByIdAndStudentId(long id, long studentId);
    long countByStudentId(long studentId);
    long countByStudentIdAndStatus(long studentId, TaskStatus status);
    List<LearningTask> findByDueDateLessThanEqualAndStatusNot(LocalDate dueDate, TaskStatus status);
    List<LearningTask> findByStudentIdAndDueDateLessThanEqualAndStatusNot(long studentId, LocalDate dueDate, TaskStatus status);
}
