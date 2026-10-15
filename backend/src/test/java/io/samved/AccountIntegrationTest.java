package io.samved;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.samved.auth.AccountRepository;
import io.samved.common.StudentProfilePort;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

/** Real CSRF/session flows against migrated tables, without mock users or authentication bypasses. */
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:accounts;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.flyway.enabled=true","spring.jpa.hibernate.ddl-auto=validate"})
@AutoConfigureMockMvc
class AccountIntegrationTest {
    @Autowired MockMvc web;
    @Autowired ObjectMapper json;
    @Autowired AccountRepository accounts;
    @Autowired StudentProfilePort profiles;
    private final String password="LocalTest123!";
    private String email() { return UUID.randomUUID()+"@example.test"; }
    private String registration(String email) throws Exception {
        return json.writeValueAsString(Map.of("email",email,"password",password,"name","Test Student",
            "educationLevel","undergraduate","cityRegion","Kochi","adultConfirmed",true,"privacyAccepted",true));
    }
    private MvcResult write(MockHttpServletRequestBuilder request,MockHttpSession session,Object body,int status) throws Exception {
        var tokenResult=web.perform(get("/api/v1/auth/csrf").session(session)).andExpect(status().isOk()).andReturn();
        String token=json.readTree(tokenResult.getResponse().getContentAsString()).get("token").asText();
        request.session(session).header("X-CSRF-TOKEN",token);
        request.with(r -> { r.setRemoteAddr(session.getId()); return r; });
        if(body!=null) request.contentType(MediaType.APPLICATION_JSON).content(body instanceof String s?s:json.writeValueAsString(body));
        return web.perform(request).andExpect(status().is(status)).andReturn();
    }
    private MockHttpSession registerAndLogin(String email) throws Exception {
        MockHttpSession session=new MockHttpSession();
        write(post("/api/v1/auth/register"),session,registration(email),201);
        return (MockHttpSession)write(post("/api/v1/auth/login"),session,Map.of("email",email,"password",password),200).getRequest().getSession();
    }
    @Test void registrationHashesPasswordNormalizesEmailAndRejectsDuplicate() throws Exception {
        String email=email(); var session=new MockHttpSession();
        var result=write(post("/api/v1/auth/register"),session,registration(email.toUpperCase()),201);
        assertThat(accounts.findByEmail(email).orElseThrow().passwordHash).startsWith("$2").isNotEqualTo(password);
        assertThat(result.getResponse().getContentAsString()).doesNotContain(password,"passwordHash");
        write(post("/api/v1/auth/register"),session,registration(email),409);
    }
    @Test void realSessionRotatesOnLoginAndLogoutRemovesAccess() throws Exception {
        String email=email(); var session=new MockHttpSession(); String before=session.getId();
        write(post("/api/v1/auth/register"),session,registration(email),201);
        var logged=(MockHttpSession)write(post("/api/v1/auth/login"),session,Map.of("email",email,"password",password),200).getRequest().getSession();
        assertThat(logged.getId()).isNotEqualTo(before);
        web.perform(get("/api/v1/auth/me").session(logged)).andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email));
        write(post("/api/v1/auth/logout"),logged,null,204);
        web.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        write(post("/api/v1/auth/logout"),new MockHttpSession(),null,204);
    }
    @Test void csrfProtectsLoginRegistrationAndPrivateWrites() throws Exception {
        web.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content(registration(email())))
            .andExpect(status().isForbidden());
        web.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isForbidden());
        var session=registerAndLogin(email());
        web.perform(put("/api/v1/students/me/interests").session(session).contentType(MediaType.APPLICATION_JSON).content("[]"))
            .andExpect(status().isForbidden());
    }
    @Test void invalidCredentialsAndConsentFailWithoutPartialAccounts() throws Exception {
        String email=email(); var session=new MockHttpSession();
        String invalid=registration(email).replace("\"adultConfirmed\":true","\"adultConfirmed\":false");
        write(post("/api/v1/auth/register"),session,invalid,400);
        assertThat(accounts.findByEmail(email)).isEmpty();
        write(post("/api/v1/auth/login"),session,Map.of("email",email,"password",password),401);
    }
    @Test void sectionsPersistAfterNewLoginAndAccountsStayIsolated() throws Exception {
        String first=email(); var a=registerAndLogin(first); var b=registerAndLogin(email());
        write(put("/api/v1/students/me/interests"),a,"[\"technology\",\"research\"]",200);
        write(put("/api/v1/students/me/skills"),a,"[{\"name\":\"Java\",\"proficiency\":\"BEGINNER\"}]",200);
        write(put("/api/v1/students/me/strengths"),a,"[\"Analytical Thinking\"]",200);
        write(put("/api/v1/students/me/values"),a,"[\"Learning\"]",200);
        String details="{\"name\":\"Saved Name\",\"educationLevel\":\"other\",\"cityRegion\":\"Kochi\",\"careerGoal\":{\"type\":\"EXPLORING\",\"text\":null}}";
        var saved=write(put("/api/v1/students/me"),a,details,200);
        write(put("/api/v1/students/me"),a,details.replace("\"name\":", "\"studentId\":999,\"name\":"),400);
        long id=json.readTree(saved.getResponse().getContentAsString()).get("id").asLong();
        assertThat(profiles.snapshot(id).skills()).containsExactly("Java");
        assertThat(profiles.snapshot(id).goalText()).isNull();
        web.perform(get("/api/v1/students/me").session(b)).andExpect(jsonPath("$.interests.length()").value(0));
        write(post("/api/v1/auth/logout"),a,null,204);
        var fresh=(MockHttpSession)write(post("/api/v1/auth/login"),new MockHttpSession(),Map.of("email",first,"password",password),200).getRequest().getSession();
        web.perform(get("/api/v1/students/me").session(fresh)).andExpect(jsonPath("$.name").value("Saved Name"))
            .andExpect(jsonPath("$.skills[0].name").value("Java"));
        write(put("/api/v1/students/me/interests"),fresh,"[]",200);
        web.perform(get("/api/v1/students/999").session(b)).andExpect(status().isForbidden());
    }
    @Test void validatesNestedSectionsAndAcademicScales() throws Exception {
        var session=registerAndLogin(email());
        write(put("/api/v1/students/me/skills"),session,"[{\"name\":\"\",\"proficiency\":\"BEGINNER\"}]",400);
        write(put("/api/v1/students/me/skills"),session,"[{\"name\":\"Java\",\"proficiency\":\"EXPERT\"}]",400);
        write(put("/api/v1/students/me/interests"),session,"[\"Technology\",\"technology\"]",400);
        String record="[{\"educationLevel\":\"undergraduate\",\"institution\":\"College\",\"course\":\"CS\",\"periodType\":\"SEMESTER\",\"period\":1,\"scoreType\":\"CGPA_10\",\"score\":8.5,\"subjects\":[{\"name\":\"Math\",\"marks\":90}]}]";
        write(put("/api/v1/students/me/academics"),session,record,200);
        write(put("/api/v1/students/me/academics"),session,record.replace("8.5","11.5"),400);
        write(put("/api/v1/students/me/academics"),session,record.replace("90","101"),400);
        web.perform(get("/api/v1/students/me/academics").session(session)).andExpect(jsonPath("$[0].score").value(8.5));
    }
    @Test void passwordChangeInvalidatesOtherSessions() throws Exception {
        String email=email(); var a=registerAndLogin(email);
        var b=(MockHttpSession)write(post("/api/v1/auth/login"),new MockHttpSession(),Map.of("email",email,"password",password),200).getRequest().getSession();
        write(put("/api/v1/auth/password"),a,Map.of("currentPassword","Wrong123!","newPassword","Changed123!"),401);
        write(put("/api/v1/auth/password"),a,Map.of("currentPassword",password,"newPassword","Changed123!"),204);
        web.perform(get("/api/v1/auth/me").session(b)).andExpect(status().isUnauthorized());
        web.perform(get("/api/v1/auth/me").session(a)).andExpect(status().isOk());
        write(post("/api/v1/auth/login"),new MockHttpSession(),Map.of("email",email,"password",password),401);
        write(post("/api/v1/auth/login"),new MockHttpSession(),Map.of("email",email,"password","Changed123!"),200);
    }
    @Test void accountDeletionRemovesPrivateJourneyAndPreservesOtherStudent() throws Exception {
        String email=email(); var a=registerAndLogin(email); var b=registerAndLogin(email());
        var otherSession=(MockHttpSession)write(post("/api/v1/auth/login"),new MockHttpSession(),Map.of("email",email,"password",password),200).getRequest().getSession();
        OnboardingTestData.complete(web,json,a);
        OnboardingTestData.complete(web,json,b);
        write(post("/api/v1/tasks"),a,Map.of("title","Private task"),200);
        write(delete("/api/v1/students/me"),a,null,204);
        assertThat(accounts.findByEmail(email)).isEmpty();
        web.perform(get("/api/v1/auth/me").session(otherSession)).andExpect(status().isUnauthorized());
        web.perform(get("/api/v1/auth/me").session(b)).andExpect(status().isOk());
        web.perform(get("/api/v1/tasks").session(b)).andExpect(jsonPath("$.length()").value(0));
        web.perform(get("/api/v1/tasks")).andExpect(status().isUnauthorized());
    }
    @Test void repeatedCredentialAttemptsAreThrottled() throws Exception {
        var session=new MockHttpSession();
        for(int attempt=0;attempt<20;attempt++) write(post("/api/v1/auth/login"),session,Map.of("email","unknown@example.test","password",password),401);
        write(post("/api/v1/auth/login"),session,Map.of("email","unknown@example.test","password",password),429);
    }
}
