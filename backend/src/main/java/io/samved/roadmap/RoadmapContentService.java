package io.samved.roadmap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.samved.common.ApiException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.*;
import java.nio.file.*;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Local personal-use snapshots; API keys and upstream HTML never reach the browser. */
@Service
public class RoadmapContentService {
    private final ObjectMapper json;
    private final String key;
    private final Path cache;
    private final URI api;
    private final HttpClient http;
    private long windowStart=System.currentTimeMillis();
    private int fetches;
    @org.springframework.beans.factory.annotation.Autowired
    public RoadmapContentService(ObjectMapper json,@Value("${PARSE_API_KEY:}") String key,
        @Value("${SAMVED_ROADMAP_CACHE_DIR:.roadmap-cache}") String directory) {
        this(json,key,Path.of(directory),URI.create("https://api.parse.bot/scraper/b661d12c-4091-495b-bda8-db302f933df4/"));
    }
    RoadmapContentService(ObjectMapper json,String key,Path directory,URI api) {
        this.json=json; this.key=key.trim(); this.cache=directory.toAbsolutePath().normalize(); this.api=api;
        this.http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
    }
    public synchronized JsonNode graph(String slug) {
        validateSlug(slug);
        JsonNode data=load("graph-"+slug,"get_roadmap_detail?slug="+slug);
        if(!data.path("nodes").isArray() || data.path("nodes").size()>2000 || data.path("nodes").isEmpty())
            throw ApiException.serviceUnavailable("The source did not return a usable roadmap graph.");
        return data;
    }
    public synchronized JsonNode topic(String slug,String nodeId) {
        validateSlug(slug);
        if(nodeId==null || !nodeId.matches("[A-Za-z0-9_-]{1,100}")) throw ApiException.badRequest("Invalid topic.");
        JsonNode node=null;
        for(JsonNode candidate:graph(slug).path("nodes")) if(nodeId.equals(candidate.path("id").asText())) { node=candidate; break; }
        if(node==null || !Set.of("topic","subtopic").contains(node.path("type").asText()))
            throw ApiException.notFound("This topic is not part of the roadmap.");
        // The optional tree snapshot enriches most nodes without a request per click.
        Path tree=cache.resolve("topics-"+slug+".json");
        if(Files.isRegularFile(tree)) {
            try {
                JsonNode root=json.readTree(Files.readAllBytes(tree));
                JsonNode found=find(root.path("data").path("nodes"),nodeId,0);
                if(found!=null && !found.path("description").asText("").isBlank()) return found;
            } catch(Exception ignored) { /* A corrupt optional snapshot does not suppress a fresh topic fetch. */ }
        }
        String topicSlug=node.path("data").path("label").asText("").toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+","-").replaceAll("^-|-$","");
        if(topicSlug.isBlank()) throw ApiException.notFound("The source has no content for this topic.");
        return load("topic-"+slug+"-"+nodeId,"get_topic_detail?roadmap_slug="+slug+"&node_id="+nodeId+"&topic_slug="+topicSlug);
    }
    private JsonNode find(JsonNode nodes,String id,int depth) {
        if(depth>50 || !nodes.isArray()) return null;
        for(JsonNode node:nodes) {
            if(id.equals(node.path("id").asText())) return node;
            JsonNode found=find(node.path("children"),id,depth+1); if(found!=null) return found;
        }
        return null;
    }
    public synchronized JsonNode guide(String slug) {
        validateSlug(slug); return load("guide-"+slug,"get_guide_content?guide_slug="+slug);
    }
    private JsonNode load(String name,String endpoint) {
        Path file=cache.resolve(name+".json");
        try {
            if(Files.isRegularFile(file) && Files.size(file)<=10_000_000) {
                JsonNode root=json.readTree(Files.readAllBytes(file));
                if("success".equals(root.path("status").asText()) && root.path("data").isObject()) return root.path("data");
            }
        } catch(Exception ignored) { /* Refetch malformed cache entries. */ }
        if(key.isBlank()) throw ApiException.serviceUnavailable("Roadmap content is not cached yet and the Parse connection is not configured.");
        long now=System.currentTimeMillis(); if(now-windowStart>3_600_000) { windowStart=now; fetches=0; }
        if(fetches>=40) throw ApiException.tooManyRequests("New roadmap content is temporarily limited. Cached roadmaps remain available; try again later.");
        fetches++;
        try {
            HttpRequest request=HttpRequest.newBuilder(api.resolve(endpoint)).timeout(Duration.ofSeconds(75))
                .header("X-API-Key",key).header("Accept","application/json").GET().build();
            var response=http.send(request,HttpResponse.BodyHandlers.ofInputStream());
            try(InputStream body=response.body()) {
                if(response.statusCode()!=200) throw new IllegalStateException("Provider returned "+response.statusCode());
                byte[] bytes=body.readNBytes(10_000_001);
                if(bytes.length>10_000_000) throw new IllegalStateException("Content too large");
                JsonNode root=json.readTree(bytes);
                if(!"success".equals(root.path("status").asText()) || !root.path("data").isObject()) throw new IllegalStateException("Invalid source content");
                Files.createDirectories(cache);
                Path temp=Files.createTempFile(cache,"snapshot-",".tmp");
                try { Files.write(temp,bytes); Files.move(temp,file,StandardCopyOption.REPLACE_EXISTING); }
                finally { Files.deleteIfExists(temp); }
                return root.path("data");
            }
        } catch(InterruptedException error) {
            Thread.currentThread().interrupt(); throw ApiException.serviceUnavailable("Roadmap loading was interrupted. Try again.");
        } catch(Exception error) { throw ApiException.serviceUnavailable("The source could not load this roadmap content. Please try again later."); }
    }
    private void validateSlug(String slug) {
        if(slug==null || !slug.matches("[a-z0-9][a-z0-9-]{0,99}")) throw ApiException.badRequest("Invalid roadmap name.");
    }
}
