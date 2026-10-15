package io.samved.notification;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class TaskNotificationController {
    private final TaskNotificationService service;
    public TaskNotificationController(TaskNotificationService service) { this.service = service; }
    @GetMapping public List<TaskNotificationService.View> mine() { return service.mine(); }
    @PatchMapping("/{id}/read") public TaskNotificationService.View markRead(@PathVariable long id) {
        return service.markRead(id);
    }
}
