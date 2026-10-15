package io.samved;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.*;
import io.samved.common.ApiException;
import io.samved.roadmap.ParseRoadmapCatalogue;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:personalroadmaps;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@AutoConfigureMockMvc
class PersonalRoadmapIntegrationTest {
    @Autowired MockMvc web;
    @Autowired ObjectMapper json;
    @MockitoBean ParseRoadmapCatalogue catalogue;
    private final String password="SurveyTest123!";
    @BeforeEach void catalogue(){when(catalogue.list()).thenReturn(List.of(
        item("frontend","Frontend Developer"),item("backend","Backend Developer"),item("full-stack","Full Stack"),
        item("data-analyst","Data Analyst"),item("ai-data-scientist","AI Data Scientist"),item("ux-design","UX Design"),
        item("python","Python"),item("java","Java"),item("javascript","JavaScript")));}
    private ParseRoadmapCatalogue.RoadmapSummary item(String id,String title){return new ParseRoadmapCatalogue.RoadmapSummary(id,title,"Learn "+title,"https://roadmap.sh/"+id,List.of(),"");}
    private MvcResult write(MockHttpServletRequestBuilder builder,MockHttpSession session,Object body,int code)throws Exception{
        var token=web.perform(get("/api/v1/auth/csrf").session(session)).andReturn();
        builder.session(session).header("X-CSRF-TOKEN",json.readTree(token.getResponse().getContentAsString()).path("token").asText());
        builder.with(r->{r.setRemoteAddr(session.getId());return r;});
        if(body!=null)builder.contentType(MediaType.APPLICATION_JSON).content(body instanceof String s?s:json.writeValueAsString(body));
        return web.perform(builder).andExpect(status().is(code)).andReturn();
    }
    private MockHttpSession account(String email)throws Exception{
        var session=new MockHttpSession();
        write(post("/api/v1/auth/register"),session,Map.of("name","Survey Student","email",email,"password",password,"educationLevel","undergraduate","cityRegion","","adultConfirmed",true,"privacyAccepted",true),201);
        return login(email,session);
    }
    private MockHttpSession account()throws Exception{return account(UUID.randomUUID()+"@example.test");}
    private MockHttpSession login(String email,MockHttpSession session)throws Exception{return (MockHttpSession)write(post("/api/v1/auth/login"),session,Map.of("email",email,"password",password),200).getRequest().getSession();}
    private JsonNode read(MockHttpSession session,String path)throws Exception{return json.readTree(web.perform(get(path).session(session)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());}
    private void assessment(MockHttpSession session,boolean research)throws Exception{
        Map<String,String> chosen=research?Map.of("work","research","activity","experimenting","problem","gathering","environment","lab","motivation","learning","working_style","independent","skill","analysis","confidence","exploring"):
            Map.of("work","technical","activity","building","problem","breaking_down","environment","software","motivation","challenge","working_style","team","skill","technical","confidence","exploring");
        write(put("/api/v1/assessments/current/responses"),session,Map.of("questionVersion",1,"answers",chosen.entrySet().stream().map(e->Map.of("questionId",e.getKey(),"optionId",e.getValue())).toList()),200);
    }
    private void complete(MockHttpSession session,boolean research)throws Exception{
        write(put("/api/v1/students/me/academics"),session,OnboardingTestData.academics(),200);
        write(put("/api/v1/students/me/interests"),session,List.of(research?"data":"technology"),200);
        write(put("/api/v1/students/me/skills"),session,List.of(Map.of("name",research?"Python":"Java","proficiency","BEGINNER")),200);
        write(put("/api/v1/students/me/strengths"),session,List.of("Analytical Thinking"),200);
        write(put("/api/v1/students/me/values"),session,List.of("Continuous Learning"),200);
        write(put("/api/v1/students/me/review/career"),session,null,200);assessment(session,research);
    }
    @Test void incompleteUsersCannotUseFeaturesOrDirectLinks()throws Exception{
        var session=account();var state=read(session,"/api/v1/students/me/onboarding");
        assertThat(state.path("completed").asInt()).isEqualTo(1);
        for(String path:List.of("/api/v1/roadmaps/guidance","/api/v1/roadmaps/catalogue","/api/v1/tasks","/api/v1/notifications","/api/v1/dashboard"))
            web.perform(get(path).session(session)).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ONBOARDING_REQUIRED"));
        for(String path:List.of("/dashboard/index.html","/career%20roadmap/index.html","/roadmap-explorer/index.html"))
            web.perform(get(java.net.URI.create(path)).session(session)).andExpect(status().isFound()).andExpect(redirectedUrl("/profile/academic.html"));
        web.perform(get("/profile/interests.html").session(session)).andExpect(status().isOk());
        write(post("/api/v1/roadmaps/preferences"),session,Map.of("slug","java"),403);
        write(post("/api/v1/tasks"),session,Map.of("title","Blocked"),403);
        write(delete("/api/v1/students/me"),session,null,204);
    }
    @Test void completeSurveysRecommendDifferentPathsFromActualAnswers()throws Exception{
        var data=account();complete(data,true);var tech=account();complete(tech,false);
        var a=read(data,"/api/v1/roadmaps/guidance");var b=read(tech,"/api/v1/roadmaps/guidance");
        assertThat(a.path("checklist").path("ready").asBoolean()).isTrue();
        assertThat(a.path("recommended").get(0).path("slug").asText()).isIn("data-analyst","ai-data-scientist");
        assertThat(b.path("recommended").get(0).path("slug").asText()).isIn("frontend","backend","full-stack");
        assertThat(a.path("recommended").get(0).path("reasons").toString()).contains("Assessment");
    }
    @Test void emptyReviewMarkersCannotBypassRequiredSectionsOrAssessment()throws Exception{
        var session=account();
        for(String section:List.of("academics","interests","skills","strengths","values","assessment"))write(put("/api/v1/students/me/review/"+section),session,null,400);
        assessment(session,true);
        assertThat(read(session,"/api/v1/students/me/onboarding").path("ready").asBoolean()).isFalse();
        complete(session,true);
        web.perform(get("/dashboard/index.html").session(session)).andExpect(status().isOk());
        write(put("/api/v1/students/me/interests"),session,List.of(),200);
        web.perform(get("/api/v1/roadmaps/guidance").session(session)).andExpect(status().isForbidden()).andExpect(jsonPath("$.nextPath").value("/profile/interests.html"));
        web.perform(get("/dashboard/index.html").session(session)).andExpect(redirectedUrl("/profile/interests.html"));
    }
    @Test void savedChoicesAreUniquePrivateAndPersistAcrossLogin()throws Exception{
        String email=UUID.randomUUID()+"@example.test";var a=account(email);var b=account();complete(a,true);complete(b,false);
        write(post("/api/v1/roadmaps/preferences"),a,Map.of("slug","java"),200);
        write(post("/api/v1/roadmaps/preferences"),a,Map.of("slug","java"),200);
        write(post("/api/v1/roadmaps/preferences"),a,Map.of("slug","python"),200);
        write(put("/api/v1/roadmaps/preferences/active"),a,Map.of("slug","java"),200);
        assertThat(read(a,"/api/v1/roadmaps/guidance").path("saved").size()).isEqualTo(2);
        assertThat(read(b,"/api/v1/roadmaps/guidance").path("saved").size()).isZero();
        write(put("/api/v1/roadmaps/preferences/active"),b,Map.of("slug","java"),404);
        write(post("/api/v1/roadmaps/preferences"),a,Map.of("slug","java","studentId",999),400);
        write(post("/api/v1/auth/logout"),a,null,204);a=login(email,new MockHttpSession());
        assertThat(read(a,"/api/v1/roadmaps/guidance").path("activeSlug").asText()).isEqualTo("java");
        write(delete("/api/v1/roadmaps/preferences/java"),a,null,200);
        assertThat(read(a,"/api/v1/roadmaps/guidance").path("activeSlug").asText()).isEqualTo("python");
        web.perform(get("/api/v1/roadmaps/guidance")).andExpect(status().isUnauthorized());
    }
    @Test void changingAnswersUpdatesRecommendationsWithoutRestrictingManualChoices()throws Exception{
        var session=account();complete(session,true);
        write(post("/api/v1/roadmaps/preferences"),session,Map.of("slug","java"),200);
        write(put("/api/v1/students/me/interests"),session,List.of("design"),200);
        write(put("/api/v1/students/me/skills"),session,List.of(Map.of("name","Design","proficiency","BEGINNER")),200);
        var state=read(session,"/api/v1/roadmaps/guidance");
        assertThat(state.path("recommended").get(0).path("slug").asText()).isEqualTo("ux-design");
        assertThat(state.path("activeSlug").asText()).isEqualTo("java");
    }
    @Test void catalogueFailureDoesNotEraseSavedChoicesOrChecklist()throws Exception{
        var session=account();complete(session,true);write(post("/api/v1/roadmaps/preferences"),session,Map.of("slug","python"),200);
        when(catalogue.list()).thenThrow(ApiException.serviceUnavailable("Unavailable"));
        var state=read(session,"/api/v1/roadmaps/guidance");assertThat(state.path("saved").size()).isEqualTo(1);
        assertThat(state.path("activeSlug").asText()).isEqualTo("python");assertThat(state.path("message").asText()).contains("temporarily unavailable");
    }
}
