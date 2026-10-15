package io.samved.roadmap;

import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1")
public class PersonalRoadmapController {
    public record Selection(String slug) { }
    private final PersonalRoadmapService service;
    public PersonalRoadmapController(PersonalRoadmapService service){this.service=service;}
    @GetMapping("/students/me/onboarding") public PersonalRoadmapService.Checklist checklist(){return service.checklist();}
    @GetMapping("/roadmaps/guidance") public PersonalRoadmapService.Guidance guidance(){return service.guidance();}
    @PostMapping("/roadmaps/preferences") public PersonalRoadmapService.Guidance save(@RequestBody Selection input){return service.save(input.slug());}
    @PutMapping("/roadmaps/preferences/active") public PersonalRoadmapService.Guidance active(@RequestBody Selection input){return service.activate(input.slug());}
    @DeleteMapping("/roadmaps/preferences/{slug}") public PersonalRoadmapService.Guidance remove(@PathVariable String slug){return service.remove(slug);}
}
