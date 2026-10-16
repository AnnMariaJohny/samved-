package io.samved;

import com.fasterxml.jackson.databind.*;
import io.samved.task.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:actionplans;MODE=MySQL;DB_CLOSE_DELAY=-1","spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@AutoConfigureMockMvc
class ActionPlanIntegrationTest {
    @Autowired MockMvc web;@Autowired ObjectMapper json;@Autowired JdbcTemplate database;
    @Autowired ActionPlanService service;
    @MockitoBean AiActionPlanner ai;
    @BeforeEach void planner(){when(ai.generate(any(),anyList(),anyString())).thenAnswer(call->new AiActionPlanner.Draft("AI","A week of research practice",java.util.stream.IntStream.range(0,7).mapToObj(i->new AiActionPlanner.Step("Research activity "+i,"Save a short literature note for "+call.getArgument(2),25)).toList()));}
    private JsonNode write(MockHttpServletRequestBuilder call,MockHttpSession session,Object value)throws Exception {
        call.session(session).with(csrf()).with(r->{r.setRemoteAddr(session.getId());return r;});
        if(value!=null)call.contentType("application/json").content(json.writeValueAsString(value));
        return json.readTree(web.perform(call).andExpect(status().is2xxSuccessful()).andReturn().getResponse().getContentAsString());
    }
    private MockHttpSession account(boolean complete)throws Exception {
        var session=new MockHttpSession();String email=UUID.randomUUID()+"@example.test",password="TestPlan!Aa123";
        write(post("/api/v1/auth/register"),session,Map.of("name","Planner Student","email",email,"password",password,"educationLevel","undergraduate","cityRegion","Kochi","adultConfirmed",true,"privacyAccepted",true));
        var login=post("/api/v1/auth/login").session(session).with(csrf()).contentType("application/json").content(json.writeValueAsString(Map.of("email",email,"password",password)));
        session=(MockHttpSession)web.perform(login).andExpect(status().isOk()).andReturn().getRequest().getSession();
        if(complete){OnboardingTestData.complete(web,json,session);write(put("/api/v1/students/me"),session,details("Research Scientist"));}return session;
    }
    private Map<String,Object> details(String goal){return Map.of("name","Planner Student","educationLevel","undergraduate","cityRegion","Kochi","careerGoal",Map.of("type","CUSTOM","text",goal));}
    private JsonNode read(MockHttpSession s,String path)throws Exception{return json.readTree(web.perform(get("/api/v1/"+path).session(s)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());}
    @Test void assignmentsPersistWithoutDuplicatesAndCompletionUpdatesProgress()throws Exception {
        var s=account(true);var plan=write(post("/api/v1/action-plan/ensure"),s,null);var tasks=read(s,"tasks");
        assertThat(plan.path("source").asText()).isEqualTo("AI");assertThat(plan.path("goal").asText()).isEqualTo("Research Scientist");assertThat(tasks.size()).isEqualTo(7);
        Set<String> dates=new HashSet<>();tasks.forEach(t->{dates.add(t.path("dueDate").asText());assertThat(t.path("automaticallyAssigned").asBoolean()).isTrue();});assertThat(dates).hasSize(7).contains(LocalDate.now(ActionPlanService.ZONE).toString());
        write(post("/api/v1/action-plan/ensure"),s,null);assertThat(read(s,"tasks").size()).isEqualTo(7);verify(ai,times(1)).generate(any(),anyList(),eq("Research Scientist"));
        write(patch("/api/v1/tasks/"+tasks.get(0).path("id").asLong()+"/status"),s,Map.of("status","COMPLETED"));
        assertThat(read(s,"progress/me").path("percent").asInt()).isEqualTo(14);
    }
    @Test void changedGoalReplansAndPreservesCompletedAndStudentEditedTasks()throws Exception {
        var s=account(true);write(post("/api/v1/action-plan/ensure"),s,null);var tasks=read(s,"tasks");
        long completed=tasks.get(0).path("id").asLong(),edited=tasks.get(1).path("id").asLong();
        write(patch("/api/v1/tasks/"+completed+"/status"),s,Map.of("status","COMPLETED"));
        write(put("/api/v1/tasks/"+edited),s,Map.of("title","My edited activity","description","Keep this","dueDate",LocalDate.now().plusDays(2).toString()));
        write(put("/api/v1/students/me"),s,details("Designer"));var plan=write(post("/api/v1/action-plan/ensure"),s,null);
        assertThat(plan.path("goal").asText()).isEqualTo("Designer");var after=read(s,"tasks");assertThat(after.size()).isEqualTo(9);
        assertThat(after.findValuesAsText("title")).contains("My edited activity");assertThat(after.findValuesAsText("status")).contains("COMPLETED");
    }
    @Test void ownershipCsrfOnboardingAndDeletionAreEnforced()throws Exception {
        var incomplete=account(false);web.perform(post("/api/v1/action-plan/ensure").session(incomplete).with(csrf())).andExpect(status().isForbidden());
        var a=account(true);web.perform(post("/api/v1/action-plan/ensure").session(a)).andExpect(status().isForbidden());write(post("/api/v1/action-plan/ensure"),a,null);
        var b=account(true);assertThat(read(b,"tasks").size()).isZero();long id=read(a,"tasks").get(0).path("id").asLong();
        web.perform(patch("/api/v1/tasks/"+id+"/status").session(b).with(csrf()).contentType("application/json").content("{\"status\":\"COMPLETED\"}")).andExpect(status().isNotFound());
        long owner=read(a,"students/me").path("id").asLong();web.perform(delete("/api/v1/students/me").session(a).with(csrf())).andExpect(status().isNoContent());
        assertThat(database.queryForObject("select count(*) from student_action_plans where student_id=?",Long.class,owner)).isZero();
        assertThat(database.queryForObject("select count(*) from learning_tasks where student_id=?",Long.class,owner)).isZero();
    }
    @Test void expiredWeekRenewsAndGuidedFallbackIsLabelled()throws Exception {
        var s=account(true);write(post("/api/v1/action-plan/ensure"),s,null);long owner=read(s,"students/me").path("id").asLong();
        database.update("update student_action_plans set through_date=? where student_id=?",LocalDate.now(ActionPlanService.ZONE).minusDays(1),owner);
        when(ai.generate(any(),anyList(),anyString())).thenReturn(new AiActionPlanner.Draft("GUIDED","AI unavailable",java.util.stream.IntStream.range(0,7).mapToObj(i->new AiActionPlanner.Step("Guided activity "+i,"Read and save a note",25)).toList()));
        assertThat(write(post("/api/v1/action-plan/ensure"),s,null).path("source").asText()).isEqualTo("GUIDED");assertThat(read(s,"tasks").size()).isEqualTo(14);
    }
    @Test void simultaneousTabsCreateOnlyOneWeek()throws Exception {
        var s=account(true);long owner=read(s,"students/me").path("id").asLong();
        var pool=java.util.concurrent.Executors.newFixedThreadPool(2);
        try{var a=pool.submit(()->service.ensure(owner));var b=pool.submit(()->service.ensure(owner));a.get();b.get();}
        finally{pool.shutdownNow();}
        assertThat(read(s,"tasks").size()).isEqualTo(7);verify(ai,times(1)).generate(any(),anyList(),eq("Research Scientist"));
    }
}
