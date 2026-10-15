package io.samved.assessment;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/assessments/current")
public class AssessmentController {
    private final AssessmentService service;

    AssessmentController(AssessmentService service) {
        this.service = service;
    }

    @GetMapping
    public AssessmentService.Current current() {
        return service.current();
    }

    @PutMapping("/responses")
    public AssessmentService.Current submit(@RequestBody AssessmentService.Submission submission) {
        return service.submit(submission);
    }

    @GetMapping("/result")
    public AssessmentService.Result result() {
        return service.result();
    }
}
