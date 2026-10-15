package io.samved.roadmap;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/roadmaps/content")
public class RoadmapContentController {
    private final RoadmapContentService content;
    public RoadmapContentController(RoadmapContentService content) { this.content=content; }
    @GetMapping public JsonNode graph(@RequestParam String slug) { return content.graph(slug); }
    @GetMapping("/topic") public JsonNode topic(@RequestParam String slug,@RequestParam String nodeId) { return content.topic(slug,nodeId); }
    @GetMapping("/guide") public JsonNode guide(@RequestParam String slug) { return content.guide(slug); }
}
