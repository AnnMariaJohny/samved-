package io.samved.roadmap;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class RoadmapController {
    private final RoadmapService service;
    private final RoadmapDiscoveryService discovery;
    private final RoleRoadmapService roles;
    public RoadmapController(RoadmapService service, RoadmapDiscoveryService discovery,
                             RoleRoadmapService roles) {
        this.service = service;
        this.discovery = discovery;
        this.roles = roles;
    }

    /** Public catalogue browsing also works for professionals without a student account. */
    @GetMapping("/roadmaps/catalogue")
    public List<ParseRoadmapCatalogue.RoadmapSummary> catalogue() { return discovery.catalogue(); }

    /** Text matching happens in Java; the browser never receives the Parse API key. */
    @GetMapping("/roadmaps/discover")
    public List<RoadmapDiscoveryService.Suggestion> discover(@RequestParam String query) {
        return discovery.suggest(query);
    }

    /** Reuse an exact roadmap.sh role, otherwise build a labelled AI starter plan. */
    @GetMapping("/roadmaps/for-role")
    public RoleRoadmap forRole(@RequestParam String jobTitle) { return roles.forRole(jobTitle); }

    @GetMapping("/roadmaps/me")
    public List<RoadmapService.RoadmapView> mine() { return service.mine(); }

    @PostMapping("/roadmaps")
    public RoadmapService.RoadmapView create(@RequestBody RoadmapService.CreateRoadmap request) {
        return service.create(request);
    }

    @PatchMapping("/milestones/{id}/status")
    public RoadmapService.MilestoneView update(@PathVariable long id, @RequestBody StatusRequest request) {
        return service.updateMilestone(id, request.status());
    }

    public record StatusRequest(MilestoneStatus status) {}
}
