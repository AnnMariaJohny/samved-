package io.samved.notification;

import io.samved.task.LearningTask;
import io.samved.task.TaskStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskNotificationRepository extends JpaRepository<TaskNotification, Long> {
    List<TaskNotification> findTop50ByStudentIdOrderByCreatedAtDesc(long studentId);
    Optional<TaskNotification> findByIdAndStudentId(long id, long studentId);
    boolean existsByTaskIdAndDueDateAndKind(long taskId, LocalDate dueDate, TaskNotification.Kind kind);
    void deleteByTaskIdAndStudentId(long taskId, long studentId);
    void deleteByStudentId(long studentId);
}
