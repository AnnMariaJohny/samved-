package io.samved.recommendation;

import io.samved.career.CareerRepository;
import io.samved.assessment.AssessmentService;
import io.samved.common.ApiException;
import io.samved.common.StudentContext;
import io.samved.common.StudentProfilePort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Recommendations are always computed from the signed-in student's profile. */
@RestController
@RequestMapping("/api/v1/recommendations")
public class RecommendationController {
    private final StudentContext studentContext;
    private final StudentProfilePort profiles;
    private final RecommendationService service;
    private final AiRecommendationService ai;
    private final CareerRepository careers;
    private final AssessmentService assessment;

    public RecommendationController(StudentContext studentContext, StudentProfilePort profiles,
                                    RecommendationService service, AiRecommendationService ai, CareerRepository careers,
                                    AssessmentService assessment) {
        this.studentContext = studentContext;
        this.profiles = profiles;
        this.service = service;
        this.ai = ai;
        this.careers = careers;
        this.assessment = assessment;
    }

    @GetMapping("/me")
    public RecommendationResponse mine() {
        long studentId = studentContext.requireStudentId();
        java.util.Set<String> themes;
        try {
            themes = java.util.Set.copyOf(assessment.result().leadingDimensions());
        } catch (ApiException error) {
            // A student may explore guidance before completing the assessment.
            if (error.status() != org.springframework.http.HttpStatus.NOT_FOUND) throw error;
            themes = java.util.Set.of();
        }
        var student = profiles.snapshot(studentId);
        var catalogue = careers.findAll();
        var rules = service.recommend(student, catalogue, themes);
        return ai.recommend(student, themes, rules);
    }

}
