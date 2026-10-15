package io.samved.roadmap;

import static org.assertj.core.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import io.samved.common.ApiException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class RoadmapContentServiceTest {
    @TempDir Path cache;
    private final ObjectMapper json=new ObjectMapper();
    private static final String GRAPH="""
        {"status":"success","data":{"title":"Frontend","nodes":[{"id":"internet-node","type":"topic","data":{"label":"Internet"},"position":{"x":0,"y":0}}],"edges":[]}}
        """;
    @Test void providerContentIsCachedAcrossServiceRestartsWithoutAKey() throws Exception {
        var calls=new AtomicInteger(); var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/get_roadmap_detail",request->{
            calls.incrementAndGet(); assertThat(request.getRequestHeaders().getFirst("X-API-Key")).isEqualTo("test-key");
            byte[] body=GRAPH.getBytes(StandardCharsets.UTF_8);request.sendResponseHeaders(200,body.length);request.getResponseBody().write(body);request.close();
        }); server.start();
        try {
            var api=URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/");
            var service=new RoadmapContentService(json,"test-key",cache,api);
            assertThat(service.graph("frontend").path("nodes").size()).isEqualTo(1);
            service.graph("frontend");
            var restarted=new RoadmapContentService(json,"",cache,api);
            assertThat(restarted.graph("frontend").path("title").asText()).isEqualTo("Frontend");
            assertThat(calls.get()).isEqualTo(1);
        } finally { server.stop(0); }
    }
    @Test void unsafeSlugsAndTopicsOutsideTheGraphAreRejected() throws Exception {
        Files.writeString(cache.resolve("graph-frontend.json"),GRAPH);
        var service=new RoadmapContentService(json,"",cache,URI.create("https://example.test/"));
        assertThatThrownBy(()->service.graph("../secret")).isInstanceOf(ApiException.class).hasMessageContaining("Invalid roadmap");
        assertThatThrownBy(()->service.topic("frontend","foreign-node")).isInstanceOf(ApiException.class).hasMessageContaining("not part");
        assertThatThrownBy(()->service.topic("frontend","../secret")).isInstanceOf(ApiException.class).hasMessageContaining("Invalid topic");
    }
    @Test void treeSnapshotSuppliesNestedTopicExplanationsWithoutExternalCalls() throws Exception {
        Files.writeString(cache.resolve("graph-frontend.json"),GRAPH);
        Files.writeString(cache.resolve("topics-frontend.json"),"""
            {"status":"success","data":{"nodes":[{"id":"root","children":[{"id":"internet-node","description":"A topic explanation","resources":[]}]}]}}
            """);
        var service=new RoadmapContentService(json,"",cache,URI.create("https://example.test/"));
        assertThat(service.topic("frontend","internet-node").path("description").asText()).isEqualTo("A topic explanation");
    }
    @Test void failedProviderResponseIsNotSavedAsARoadmap() throws Exception {
        var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/get_roadmap_detail",request->{request.sendResponseHeaders(502,-1);request.close();});server.start();
        try {
            var service=new RoadmapContentService(json,"test",cache,URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/"));
            assertThatThrownBy(()->service.graph("frontend")).isInstanceOf(ApiException.class).hasMessageContaining("could not load");
            assertThat(Files.exists(cache.resolve("graph-frontend.json"))).isFalse();
        } finally { server.stop(0); }
    }
    @Test void guideUsesProviderGuideSlugAndCachesRichContent() throws Exception {
        var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/get_guide_content",request->{
            assertThat(request.getRequestURI().getQuery()).isEqualTo("guide_slug=what-is-internet");
            byte[] body="{\"status\":\"success\",\"data\":{\"content\":{\"type\":\"doc\",\"content\":[]}}}".getBytes(StandardCharsets.UTF_8);
            request.sendResponseHeaders(200,body.length);request.getResponseBody().write(body);request.close();
        });server.start();
        try {
            var service=new RoadmapContentService(json,"test",cache,URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/"));
            assertThat(service.guide("what-is-internet").path("content").path("type").asText()).isEqualTo("doc");
            assertThat(Files.exists(cache.resolve("guide-what-is-internet.json"))).isTrue();
        }finally{server.stop(0);}
    }
}
