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
import java.util.ArrayList;
import java.util.List;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Test;

class ParseRoadmapCatalogueTest {
    @Test
    void readsLiveEnvelopeKeepsOnlySafeLinksAndCachesResult() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        AtomicReference<String> suppliedKey = new AtomicReference<>();
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/list_roadmaps", exchange -> {
            calls.incrementAndGet();
            suppliedKey.set(exchange.getRequestHeaders().getFirst("X-API-Key"));
            String response = "{\"status\":\"success\",\"data\":{\"roadmaps\":["
                + "{\"id\":\"python\",\"title\":\"Python\",\"description\":\"Learn in @currentYear@\","
                + "\"url\":\"/python\",\"metadata\":{\"tags\":[\"skill-roadmap\"]},"
                + "\"updatedAt\":\"2026-09-29T15:24:37Z\"},"
                + "{\"id\":\"frontend-beginner\",\"title\":\"Frontend Beginner\","
                + "\"url\":\"/frontend?r=frontend-beginner\"},"
                + "{\"id\":\"bad\",\"title\":\"Bad\",\"url\":\"https://evil.example/path\"}]}}";
            byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        try {
            var catalogue = new ParseRoadmapCatalogue("test-key",
                URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/list_roadmaps"),
                HttpClient.newHttpClient(), new ObjectMapper());
            assertThat(catalogue.list()).hasSize(2);
            assertThat(catalogue.list().get(0).url()).isEqualTo("https://roadmap.sh/python");
            assertThat(catalogue.list().get(1).url()).isEqualTo("https://roadmap.sh/frontend?r=frontend-beginner");
            assertThat(catalogue.list().get(0).description()).doesNotContain("@currentYear@");
            assertThat(suppliedKey.get()).isEqualTo("test-key");
            assertThat(calls.get()).isEqualTo(1);
        } finally { server.stop(0); }
    }

    @Test
    void missingKeyDoesNotCallProvider() {
        var catalogue = new ParseRoadmapCatalogue("", URI.create("http://127.0.0.1:1"),
            HttpClient.newHttpClient(), new ObjectMapper());
        assertThatThrownBy(catalogue::list).hasMessageContaining("not configured");
    }

    @Test
    void savedCatalogueSurvivesServiceRestartWithoutAnotherParseCall() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        List<RoadmapCatalogueEntry> rows = new ArrayList<>();
        RoadmapCatalogueRepository repository = mock(RoadmapCatalogueRepository.class);
        when(repository.findAllByOrderBySortOrderAsc()).thenAnswer(invocation -> List.copyOf(rows));
        when(repository.saveAll(any())).thenAnswer(invocation -> {
            Iterable<RoadmapCatalogueEntry> written = invocation.getArgument(0);
            written.forEach(rows::add);
            return List.copyOf(rows);
        });
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/list_roadmaps", exchange -> {
            calls.incrementAndGet();
            byte[] bytes = "{\"status\":\"success\",\"data\":{\"roadmaps\":[{\"id\":\"java\",\"title\":\"Java\",\"url\":\"/java\"}]}}"
                .getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
        try {
            URI endpoint = URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/list_roadmaps");
            var first = new ParseRoadmapCatalogue("test-key", endpoint, HttpClient.newHttpClient(),
                new ObjectMapper(), repository);
            assertThat(first.list()).hasSize(1);
            var restarted = new ParseRoadmapCatalogue("", endpoint, HttpClient.newHttpClient(),
                new ObjectMapper(), repository);
            assertThat(restarted.list()).hasSize(1);
            assertThat(restarted.list().get(0).url()).isEqualTo("https://roadmap.sh/java");
            assertThat(calls.get()).isEqualTo(1);
        } finally { server.stop(0); }
    }
}
