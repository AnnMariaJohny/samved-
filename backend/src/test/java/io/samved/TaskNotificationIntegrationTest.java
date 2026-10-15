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
import io.samved.notification.TaskNotificationService;
import io.samved.task.LearningTask;
import io.samved.task.LearningTaskRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Real HTTP-shaped requests cover reminder creation, isolation and cleanup. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TaskNotificationIntegrationTest {
    // These tests isolate task ownership/reminders; real onboarding enforcement is covered separately.
    @org.springframework.test.context.bean.override.mockito.MockitoBean io.samved.roadmap.PersonalRoadmapService onboarding;
    @org.junit.jupiter.api.BeforeEach void completedOnboarding() {
        org.mockito.Mockito.when(onboarding.checklist()).thenReturn(new io.samved.roadmap.PersonalRoadmapService.Checklist(8,8,true,java.util.List.of()));
    }
    @Autowired MockMvc browser;
    @Autowired ObjectMapper json;
    @Autowired LearningTaskRepository tasks;
    @Autowired TaskNotificationService reminders;

    private MockHttpSession student(long id) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(StudentContext.SESSION_STUDENT_ID, id);
        return session;
    }

    @Test
    void dueTaskCreatesPrivateReminderOnlyOnceAndCompletionClearsIt() throws Exception {
        LocalDate due = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        var created = browser.perform(post("/api/v1/tasks").with(user("student-a")).with(csrf())
                .session(student(301L)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Submit portfolio\",\"dueDate\":\"" + due + "\"}"))
            .andExpect(status().isOk()).andReturn();
        long taskId = json.readTree(created.getResponse().getContentAsString()).get("id").asLong();

        var first = browser.perform(get("/api/v1/notifications").with(user("student-a")).session(student(301L)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].message").value("Due today: Submit portfolio"))
            .andReturn();
        JsonNode reminder = json.readTree(first.getResponse().getContentAsString()).get(0);
        long notificationId = reminder.get("id").asLong();
        browser.perform(get("/api/v1/notifications").with(user("student-a")).session(student(301L)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        browser.perform(get("/api/v1/notifications").with(user("student-b")).session(student(302L)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        browser.perform(patch("/api/v1/notifications/{id}/read", notificationId)
                .with(user("student-b")).with(csrf()).session(student(302L)))
            .andExpect(status().isNotFound());
        browser.perform(patch("/api/v1/notifications/{id}/read", notificationId)
                .with(user("student-a")).with(csrf()).session(student(301L)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.readAt").isNotEmpty());

        browser.perform(patch("/api/v1/tasks/{id}/status", taskId).with(user("student-a"))
                .with(csrf()).session(student(301L)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"COMPLETED\"}"))
            .andExpect(status().isOk());
        browser.perform(get("/api/v1/notifications").with(user("student-a")).session(student(301L)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void backgroundScanCreatesTomorrowReminderWithoutAnOpenBrowser() throws Exception {
        LocalDate tomorrow = LocalDate.now(ZoneId.of("Asia/Kolkata")).plusDays(1);
        tasks.saveAndFlush(new LearningTask(311L, null, null, "Review application", null, tomorrow));

        reminders.scanDueTasks();
        reminders.scanDueTasks();

        browser.perform(get("/api/v1/notifications").with(user("student-c")).session(student(311L)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].kind").value("DUE_TOMORROW"));
    }
}
