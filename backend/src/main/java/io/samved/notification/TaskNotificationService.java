package io.samved.notification;

import io.samved.common.ApiException;
import io.samved.common.StudentContext;
import io.samved.task.LearningTask;
import io.samved.task.LearningTaskRepository;
import io.samved.task.TaskStatus;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Creates due-date reminders and exposes only the current student's notifications. */
@Service
public class TaskNotificationService {
    private final TaskNotificationRepository notifications;
    private final LearningTaskRepository tasks;
    private final StudentContext context;
    private final ZoneId zone;

    public TaskNotificationService(TaskNotificationRepository notifications, LearningTaskRepository tasks,
                                   StudentContext context,
                                   @Value("${samved.reminders.zone:Asia/Kolkata}") String zone) {
        this.notifications = notifications;
        this.tasks = tasks;
        this.context = context;
        this.zone = ZoneId.of(zone);
    }

    /** The hourly job also works when nobody has the site open. */
    @Scheduled(fixedDelayString = "${samved.reminders.poll-ms:3600000}")
    @Transactional
    public void scanDueTasks() {
        LocalDate today = LocalDate.now(zone);
        for (LearningTask task : tasks.findByDueDateLessThanEqualAndStatusNot(today.plusDays(1), TaskStatus.COMPLETED)) {
            createIfDue(task, today);
        }
    }

    /** A read refreshes the student's reminders so newly created tasks appear immediately. */
    @Transactional
    public List<View> mine() {
        long studentId = context.requireStudentId();
        LocalDate today = LocalDate.now(zone);
        for (LearningTask task : tasks.findByStudentIdAndDueDateLessThanEqualAndStatusNot(
                studentId, today.plusDays(1), TaskStatus.COMPLETED)) {
            createIfDue(task, today);
        }
        return notifications.findTop50ByStudentIdOrderByCreatedAtDesc(studentId).stream().map(this::view).toList();
    }

    @Transactional
    public View markRead(long id) {
        TaskNotification notification = notifications.findByIdAndStudentId(id, context.requireStudentId())
            .orElseThrow(() -> ApiException.notFound("Notification not found"));
        notification.markRead();
        return view(notification);
    }

    /** Called when a task changes so superseded reminders are not shown. */
    @Transactional
    public void clearForTask(LearningTask task) {
        notifications.deleteByTaskIdAndStudentId(task.getId(), task.getStudentId());
    }

    private void createIfDue(LearningTask task, LocalDate today) {
        if (task.getDueDate() == null || task.getStatus() == TaskStatus.COMPLETED) return;
        TaskNotification.Kind kind = task.getDueDate().isBefore(today) ? TaskNotification.Kind.OVERDUE
            : task.getDueDate().isEqual(today) ? TaskNotification.Kind.DUE_TODAY
            : TaskNotification.Kind.DUE_TOMORROW;
        if (notifications.existsByTaskIdAndDueDateAndKind(task.getId(), task.getDueDate(), kind)) return;
        String prefix = switch (kind) {
            case DUE_TOMORROW -> "Due tomorrow: ";
            case DUE_TODAY -> "Due today: ";
            case OVERDUE -> "Overdue: ";
        };
        // Leave room for the prefix even when the task title uses its full allowed length.
        String title = task.getTitle().substring(0, Math.min(task.getTitle().length(), 240 - prefix.length()));
        notifications.save(new TaskNotification(task.getStudentId(), task.getId(), task.getDueDate(), kind, prefix + title));
    }

    private View view(TaskNotification item) {
        return new View(item.getId(), item.getTaskId(), item.getDueDate(), item.getKind(),
            item.getMessage(), item.getCreatedAt(), item.getReadAt());
    }
    public record View(long id, long taskId, LocalDate dueDate, TaskNotification.Kind kind,
                       String message, java.time.Instant createdAt, java.time.Instant readAt) {}
}
