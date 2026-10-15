package io.samved.career;

import static org.assertj.core.api.Assertions.assertThat;

import io.samved.common.StudentSnapshot;
import io.samved.recommendation.RecommendationResponse;
import io.samved.recommendation.RecommendationService;
import java.util.List;
import org.junit.jupiter.api.Test;

class RecommendationServiceTest {
    private final RecommendationService rules = new RecommendationService();
    private final Career software = new Career("software-engineer", "Software Engineer", "Build software",
            List.of("technology", "coding"), List.of("programming", "testing"),
            List.of("analytical thinking"), List.of("learning"));
    private final Career teacher = new Career("teacher", "Teacher", "Teach students",
            List.of("education", "helping people"), List.of("teaching", "communication"),
            List.of("patience"), List.of("service"));

    @Test
    void selectedGoalAndKnownSkillGiveReasonsAndHonestGaps() {
        var student = new StudentSnapshot("UNDERGRADUATE", "SELECTED", "Software Engineer",
                List.of("coding"), List.of("programming"), List.of("analytical thinking"), List.of("learning"));
        RecommendationResponse result = rules.recommend(student, List.of(teacher, software));

        assertThat(result.recommendations()).hasSize(1);
        assertThat(result.recommendations().get(0).careerId()).isEqualTo("software-engineer");
        assertThat(result.recommendations().get(0).reasons()).anyMatch(reason -> reason.contains("stated career goal"));
        assertThat(result.recommendations().get(0).matchedSkills()).containsExactly("programming");
        assertThat(result.recommendations().get(0).skillGaps()).containsExactly("testing");
        assertThat(result.recommendations().get(0).ruleVersion()).isEqualTo(RecommendationService.RULE_VERSION);
    }

    @Test
    void uncertainStudentWithNoSignalsGetsNoInventedRecommendation() {
        var student = new StudentSnapshot("UNDERGRADUATE", "EXPLORING", "I'm not sure yet",
                List.of(), List.of(), List.of(), List.of());

        RecommendationResponse result = rules.recommend(student, List.of(software, teacher));

        assertThat(result.exploratory()).isTrue();
        assertThat(result.recommendations()).isEmpty();
        assertThat(result.guidance()).contains("cannot infer");
    }

    @Test
    void rankingDoesNotDependOnCatalogueOrderOrCase() {
        var student = new StudentSnapshot("UNDERGRADUATE", "EXPLORING", null,
                List.of("  CODING "), List.of("PROGRAMMING"), List.of(), List.of());

        var first = rules.recommend(student, List.of(teacher, software));
        var second = rules.recommend(student, List.of(software, teacher));

        assertThat(first.recommendations()).isEqualTo(second.recommendations());
        assertThat(first.recommendations().get(0).score()).isEqualTo(33);
    }

    @Test
    void customGoalIsPreservedInsteadOfSilentlyMappedToAnotherCareer() {
        var student = new StudentSnapshot("UNDERGRADUATE", "CUSTOM", "Marine Biologist",
                List.of("science"), List.of(), List.of(), List.of());

        RecommendationResponse result = rules.recommend(student, List.of(software, teacher));

        assertThat(result.exploratory()).isTrue();
        assertThat(result.guidance()).contains("custom goal remains yours");
        assertThat(result.recommendations()).isEmpty();
    }

    @Test
    void leadingAssessmentThemeAddsAnExplainedSignal() {
        var student = new StudentSnapshot("UNDERGRADUATE", "EXPLORING", null,
                List.of(), List.of(), List.of(), List.of());
        var result = rules.recommend(student, List.of(teacher, software), java.util.Set.of("TECHNOLOGY"));
        assertThat(result.recommendations()).hasSize(1);
        assertThat(result.recommendations().get(0).careerId()).isEqualTo("software-engineer");
        assertThat(result.recommendations().get(0).reasons()).anyMatch(reason -> reason.contains("assessment theme"));
    }
}
