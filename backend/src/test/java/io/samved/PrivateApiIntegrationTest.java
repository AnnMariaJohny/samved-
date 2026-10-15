package io.samved;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.samved.common.StudentContext;
import io.samved.opportunity.Opportunity;
import io.samved.opportunity.OpportunityRepository;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Browser-shaped requests prove the server session, not body IDs, controls private data. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PrivateApiIntegrationTest {
    // These tests isolate task ownership/reminders; real onboarding enforcement is covered separately.
    @org.springframework.test.context.bean.override.mockito.MockitoBean io.samved.roadmap.PersonalRoadmapService onboarding;
    @org.junit.jupiter.api.BeforeEach void completedOnboarding() {
        org.mockito.Mockito.when(onboarding.checklist()).thenReturn(new io.samved.roadmap.PersonalRoadmapService.Checklist(8,8,true,java.util.List.of()));
    }
    @Autowired MockMvc browser;
    @Autowired ObjectMapper json;
    @Autowired OpportunityRepository opportunities;
    @Autowired io.samved.auth.AccountRepository accounts;
    @Autowired io.samved.student.StudentProfileRepository profiles;

    private MockHttpSession student(long id) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(StudentContext.SESSION_STUDENT_ID, id);
        return session;
    }

    @Test
    void secondStudentCannotChangeTheFirstStudentsTask() throws Exception {
        var created = browser.perform(post("/api/v1/tasks")
                .with(user("asha")).with(csrf()).session(student(101L))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Read one paper\"}"))
            .andExpect(status().isOk()).andReturn();
        JsonNode body = json.readTree(created.getResponse().getContentAsString());
        long taskId = body.get("id").asLong();

        browser.perform(patch("/api/v1/tasks/{id}/status", taskId)
                .with(user("ravi")).with(csrf()).session(student(102L))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"COMPLETED\"}"))
            .andExpect(status().isNotFound());
        browser.perform(get("/api/v1/tasks").with(user("ravi")).session(student(102L)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        browser.perform(get("/api/v1/tasks").with(user("asha")).session(student(101L)))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].title").value("Read one paper"));
    }

    @Test
    void opportunityFeedHidesPassedExactDeadline() throws Exception {
        var account = new io.samved.auth.Account();
        account.email = "opportunity-fixture@example.test"; account.passwordHash = "unused-test-hash";
        account.acceptedAt = Instant.now(); account.privacyVersion = "test"; accounts.saveAndFlush(account);
        var profile = new io.samved.student.StudentProfile();
        profile.account = account; profile.name = "Fixture"; profile.educationLevel = "other";
        profiles.saveAndFlush(profile);
        Instant now = Instant.now();
        opportunities.saveAndFlush(new Opportunity("HACKATHON", "Open event", "Organizer", "Original summary",
            "https://example.org/open", "Organizer", "https://example.org/open-info", now,
            LocalDate.now().plusDays(1), now.plusSeconds(3600), "Asia/Kolkata", "Online", "Adults", true));
        opportunities.saveAndFlush(new Opportunity("HACKATHON", "Closed event", "Organizer", "Original summary",
            "https://example.org/closed", "Organizer", "https://example.org/closed-info", now,
            LocalDate.now(), now.minusSeconds(3600), "Asia/Kolkata", "Online", "Adults", true));

        browser.perform(get("/api/v1/opportunities").with(user("asha")).session(student(profile.id)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].title").value("Open event"));
    }
}
