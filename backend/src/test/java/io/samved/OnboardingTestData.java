package io.samved;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

final class OnboardingTestData {
    static List<?> academics() {
        return List.of(Map.of("educationLevel","undergraduate","institution","College","course","CS","periodType","SEMESTER",
            "period",1,"scoreType","CGPA_10","score",8.5,"subjects",List.of(Map.of("name","Math","marks",90))));
    }
    static void complete(MockMvc web,ObjectMapper json,MockHttpSession session)throws Exception {
        var sections=Map.of("academics",academics(),"interests",List.of("Research"),"skills",List.of(Map.of("name","Python","proficiency","BEGINNER")),
            "strengths",List.of("Research"),"values",List.of("Continuous Learning"));
        for(var entry:sections.entrySet())web.perform(put("/api/v1/students/me/"+entry.getKey()).session(session).with(csrf())
            .contentType("application/json").content(json.writeValueAsString(entry.getValue()))).andExpect(status().isOk());
        web.perform(put("/api/v1/students/me/review/career").session(session).with(csrf())).andExpect(status().isOk());
        Map<String,String> chosen=Map.of("work","research","activity","experimenting","problem","gathering","environment","lab",
            "motivation","learning","working_style","independent","skill","analysis","confidence","exploring");
        web.perform(put("/api/v1/assessments/current/responses").session(session).with(csrf()).contentType("application/json")
            .content(json.writeValueAsString(Map.of("questionVersion",1,"answers",chosen.entrySet().stream()
                .map(e->Map.of("questionId",e.getKey(),"optionId",e.getValue())).toList())))).andExpect(status().isOk());
    }
}
