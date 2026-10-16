package io.samved.recommendation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import io.samved.assessment.AssessmentService;
import io.samved.career.CareerRepository;
import io.samved.common.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

class RecommendationSessionTest {
    @Test void unchangedProfileReusesRankingAndEditsInvalidateIt() {
        var context=mock(StudentContext.class);var profiles=mock(StudentProfilePort.class);
        var rules=mock(RecommendationService.class);var ai=mock(AiRecommendationService.class);
        var careers=mock(CareerRepository.class);var assessment=mock(AssessmentService.class);
        when(context.requireStudentId()).thenReturn(7L);
        var original=new StudentSnapshot("undergraduate","EXPLORING",null,List.of("Technology"),List.of("Java"),List.of("Curiosity"),List.of("Learning"));
        when(profiles.snapshot(7L)).thenReturn(original);
        when(assessment.result()).thenReturn(new AssessmentService.Result(1,Map.of(),List.of("TECHNOLOGY"),"exploring",8,""));
        when(careers.findAll()).thenReturn(List.of());
        var response=new RecommendationResponse("test","Test guidance",true,List.of(),"AI");
        when(rules.recommend(any(),anyList(),anySet())).thenReturn(response);
        when(ai.recommend(any(),anySet(),any())).thenReturn(response);
        var controller=new RecommendationController(context,profiles,rules,ai,careers,assessment);
        var session=new MockHttpSession();
        assertThat(controller.mine(session)).isSameAs(response);
        assertThat(controller.mine(session)).isSameAs(response);
        verify(ai,times(1)).recommend(any(),anySet(),any());
        when(profiles.snapshot(7L)).thenReturn(new StudentSnapshot("undergraduate","CUSTOM","Designer",original.interests(),original.skills(),original.strengths(),original.values()));
        controller.mine(session);
        verify(ai,times(2)).recommend(any(),anySet(),any());
        controller.mine(new MockHttpSession());
        verify(ai,times(3)).recommend(any(),anySet(),any());
    }
}
