package io.samved.task;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
public class LearningTaskController {
    private final LearningTaskService service;
    public LearningTaskController(LearningTaskService service) { this.service = service; }
    @GetMapping public List<LearningTaskService.TaskView> mine() { return service.mine(); }
    @PostMapping public LearningTaskService.TaskView create(@RequestBody LearningTaskService.TaskInput input) { return service.create(input); }
    @PutMapping("/{id}") public LearningTaskService.TaskView update(@PathVariable long id,
        @RequestBody LearningTaskService.TaskInput input) { return service.update(id, input); }
    @PatchMapping("/{id}/status") public LearningTaskService.TaskView status(@PathVariable long id,
        @RequestBody StatusRequest request) { return service.changeStatus(id, request.status()); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) { service.delete(id); }
    public record StatusRequest(TaskStatus status) {}
}
