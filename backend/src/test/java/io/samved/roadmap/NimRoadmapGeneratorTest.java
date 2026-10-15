package io.samved.roadmap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class NimRoadmapGeneratorTest {
    private final ObjectMapper json = new ObjectMapper();

    @Test
    void returnsValidatedFiveStepPlanAndCachesIt() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        AtomicReference<String> sentBody = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/chat/completions", exchange -> {
            calls.incrementAndGet();
            sentBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            var plan = json.createObjectNode();
            plan.put("summary", "A practical starter path.");
            var steps = plan.putArray("milestones");
            for (int index = 1; index <= 5; index++) {
                steps.addObject().put("title", "Step " + index).put("description", "Do activity " + index + ".");
            }
            var body = json.createObjectNode();
            body.putArray("choices").addObject().putObject("message").put("content", plan.toString());
            byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        try {
            var generator = new NimRoadmapGenerator("test-key", "openai/gpt-oss-20b",
                URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/v1/chat/completions"),
                HttpClient.newHttpClient(), json);
            RoleRoadmap result = generator.generate("Museum Curator");
            assertThat(result.source()).isEqualTo("AI_GENERATED");
            assertThat(result.url()).isNull();
            assertThat(result.milestones()).hasSize(5);
            assertThat(sentBody.get()).contains("Museum Curator", "openai/gpt-oss-20b", "json_object")
                .doesNotContain("test-key");
            assertThat(generator.generate("Museum Curator")).isEqualTo(result);
            assertThat(calls.get()).isEqualTo(1);
        } finally { server.stop(0); }
    }

    @Test
    void missingKeyCannotCallProvider() {
        var generator = new NimRoadmapGenerator("", "openai/gpt-oss-20b", URI.create("http://127.0.0.1:1"),
            HttpClient.newHttpClient(), json);
        assertThatThrownBy(() -> generator.generate("Museum Curator"))
            .hasMessageContaining("not configured");
    }
}
