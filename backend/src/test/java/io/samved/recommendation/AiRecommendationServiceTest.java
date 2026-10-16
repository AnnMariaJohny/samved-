package io.samved.recommendation;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import io.samved.common.StudentSnapshot;
import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class AiRecommendationServiceTest {
    private final ObjectMapper json = new ObjectMapper();
    private final StudentSnapshot student = new StudentSnapshot("UNDERGRADUATE", "EXPLORING", "",
        List.of("coding"), List.of("programming"), List.of(), List.of());
    private final RecommendationDto software = new RecommendationDto("software-engineer", "Software Engineer", 50,
        List.of("Interest overlap: coding."), List.of("programming"), List.of("testing"), List.of("coding"),
        RecommendationService.RULE_VERSION);
    private final RecommendationDto data = new RecommendationDto("data-analyst", "Data Analyst", 30,
        List.of("Existing skills: programming."), List.of("programming"), List.of("statistics"), List.of(),
        RecommendationService.RULE_VERSION);
    private final RecommendationResponse rules = new RecommendationResponse(RecommendationService.RULE_VERSION,
        "Provisional career ideas", true, List.of(software, data));

    @Test
    void validProviderSelectionReranksCandidatesWithoutSendingIdentity() throws Exception {
        AtomicReference<String> requestBody = new AtomicReference<>();
        HttpServer server = serve(200, providerText("{\"careerIds\":[\"data-analyst\",\"software-engineer\"]}"), requestBody);
        try {
            var ai = client(server, "test-key");
            var result = ai.recommend(student, Set.of("TECHNOLOGY"), rules);
            assertThat(result.source()).isEqualTo("AI");
            assertThat(result.recommendations()).extracting(RecommendationDto::careerId)
                .containsExactly("data-analyst", "software-engineer");
            assertThat(result.recommendations().get(0).score()).isEqualTo(30);
            assertThat(result.guidance()).contains("AI selected");
            assertThat(requestBody.get()).contains("coding", "candidateCareers", "\"response_format\"", "\"messages\"", "openai/gpt-oss-20b")
                .doesNotContain("test-key", "studentId", "email");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void invalidOrFabricatedProviderOutputFallsBackToTransparentRules() throws Exception {
        HttpServer server = serve(200, providerText("{\"careerIds\":[\"invented-career\"]}"), new AtomicReference<>());
        try {
            var result = client(server, "test-key").recommend(student, Set.of(), rules);
            assertThat(result.source()).isEqualTo("RULES_FALLBACK");
            assertThat(result.recommendations()).isEqualTo(rules.recommendations());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void missingKeyNeverCallsProvider() {
        var ai = new AiRecommendationService("", "test-model", java.net.URI.create("http://127.0.0.1:1"),
            HttpClient.newHttpClient(), json);
        assertThat(ai.recommend(student, Set.of(), rules).source()).isEqualTo("RULES");
    }

    @Test void providerMatchEstimatesAreValidatedAndReturned() throws Exception {
        HttpServer server=serve(200,providerText("{\"careerIds\":[\"software-engineer\"],\"matches\":[{\"careerId\":\"software-engineer\",\"percent\":84,\"explanation\":\"Your coding interest aligns with this role.\"}]}"),new AtomicReference<>());
        try{var result=client(server,"test-key").recommend(student,Set.of(),rules);assertThat(result.recommendations().get(0).aiMatchPercent()).isEqualTo(84);assertThat(result.recommendations().get(0).score()).isEqualTo(50);}finally{server.stop(0);}
    }
    @Test void invalidMatchPercentageFallsBackInsteadOfDisplayingInventedScore() throws Exception {
        HttpServer server=serve(200,providerText("{\"careerIds\":[\"software-engineer\"],\"matches\":[{\"careerId\":\"software-engineer\",\"percent\":184,\"explanation\":\"Test\"}]}"),new AtomicReference<>());
        try{assertThat(client(server,"test-key").recommend(student,Set.of(),rules).source()).isEqualTo("RULES_FALLBACK");}finally{server.stop(0);}
    }

    private AiRecommendationService client(HttpServer server, String key) {
        return new AiRecommendationService(key, "openai/gpt-oss-20b",
            java.net.URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/v1/chat/completions"),
            HttpClient.newHttpClient(), json);
    }

    private static HttpServer serve(int status, String response, AtomicReference<String> body) throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/chat/completions", exchange -> {
            body.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        return server;
    }

    private static String providerText(String ranking) {
        return "{\"choices\":[{\"message\":{\"content\":"
            + "\"" + ranking.replace("\\", "\\\\").replace("\"", "\\\"") + "\"}}]}";
    }
}
