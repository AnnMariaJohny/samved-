package io.samved;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;

import io.samved.roadmap.ParseRoadmapCatalogue;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** Tests same-origin static hosting and private API behavior before Christa's login exists. */
@SpringBootTest
@AutoConfigureMockMvc
class WebBoundaryTest {
    @Autowired MockMvc browser;
    @MockitoBean ParseRoadmapCatalogue catalogue;

    @Test
    void homepageAndHealthArePublicButStudentApiRequiresAuthentication() throws Exception {
        browser.perform(get("/")).andExpect(status().isOk());
        browser.perform(get("/roadmap-explorer/index.html")).andExpect(status().isFound());
        browser.perform(get("/actuator/health")).andExpect(status().isOk());
        browser.perform(get("/api/v1/roadmaps/me")).andExpect(status().isUnauthorized());
        browser.perform(get("/api/v1/roadmaps/content").param("slug","frontend")).andExpect(status().isUnauthorized());
    }

    @Test
    void roadmapDiscoveryRequiresSignIn() throws Exception {
        when(catalogue.list()).thenReturn(List.of(new ParseRoadmapCatalogue.RoadmapSummary(
            "python", "Python", "Learn Python", "https://roadmap.sh/python", List.of(), "")));
        browser.perform(get("/api/v1/roadmaps/catalogue")).andExpect(status().isUnauthorized());
        browser.perform(get("/api/v1/roadmaps/discover").param("query", "python"))
            .andExpect(status().isUnauthorized());
        browser.perform(get("/api/v1/roadmaps/for-role").param("jobTitle", "Python"))
            .andExpect(status().isUnauthorized());
        browser.perform(get("/api/v1/roadmaps/me")).andExpect(status().isUnauthorized());
    }
}
