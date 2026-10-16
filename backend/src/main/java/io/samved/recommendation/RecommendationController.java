package io.samved.recommendation;

import io.samved.career.CareerRepository;
import io.samved.assessment.AssessmentService;
import io.samved.common.ApiException;
import io.samved.common.StudentContext;
import io.samved.common.StudentProfilePort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpSession;
import io.samved.common.StudentSnapshot;

/** Recommendations are always computed from the signed-in student's profile. */
@RestController
@RequestMapping("/api/v1/recommendations")
public class RecommendationController {
    private record Cached(long studentId, StudentSnapshot profile, java.util.Set<String> themes,
                          long expiresAt, RecommendationResponse response) { }
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
    public RecommendationResponse mine(HttpSession session) {
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
        Object cached=session.getAttribute("samvedCareerRecommendations");
        if(cached instanceof Cached c && c.studentId()==studentId && c.expiresAt()>System.currentTimeMillis()
            && c.profile().equals(student) && c.themes().equals(themes)) return c.response();
        var catalogue = careers.findAll();
        var rules = service.recommend(student, catalogue, themes);
        var result=ai.recommend(student, themes, rules);
        long lifetime="AI".equals(result.source())?600_000:60_000;
        session.setAttribute("samvedCareerRecommendations",new Cached(studentId,student,themes,
            System.currentTimeMillis()+lifetime,result));
        return result;
    }

}
