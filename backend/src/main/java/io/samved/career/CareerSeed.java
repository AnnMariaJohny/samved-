package io.samved.career;

import java.util.List;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Small, original launch catalogue. Later updates require editorial review. */
@Configuration
class CareerSeed {
    @Bean
    ApplicationRunner seedCareers(CareerRepository careers) {
        return args -> {
            for (Career career : initialCareers()) {
                // Preserve later editorial changes: insert only missing catalogue entries.
                if (!careers.existsById(career.getId())) careers.save(career);
            }
        };
    }

    private List<Career> initialCareers() {
        return List.of(
                new Career("software-engineer", "Software Engineer", "Build and maintain software that solves real problems.",
                        List.of("technology", "coding", "problem solving"), List.of("programming", "testing", "debugging"),
                        List.of("analytical thinking", "persistence"), List.of("creativity", "learning")),
                new Career("data-analyst", "Data Analyst", "Turn data into understandable evidence for decisions.",
                        List.of("data", "mathematics", "problem solving"), List.of("statistics", "sql", "data visualization"),
                        List.of("analytical thinking", "attention to detail"), List.of("learning", "impact")),
                new Career("research-scientist", "Research Scientist", "Ask questions, design studies and share evidence.",
                        List.of("science", "research", "experiments"), List.of("research methods", "statistics", "scientific writing"),
                        List.of("curiosity", "analytical thinking"), List.of("discovery", "learning")),
                new Career("doctor", "Doctor", "Study medicine and care for patients within licensed clinical practice.",
                        List.of("biology", "healthcare", "helping people"), List.of("biology", "communication", "clinical reasoning"),
                        List.of("empathy", "attention to detail"), List.of("service", "responsibility")),
                new Career("teacher", "Teacher", "Help learners understand subjects and develop confidence.",
                        List.of("education", "helping people", "communication"), List.of("subject knowledge", "teaching", "communication"),
                        List.of("patience", "empathy"), List.of("service", "learning")),
                new Career("designer", "Designer", "Research user needs and create useful visual or digital experiences.",
                        List.of("design", "art", "technology"), List.of("visual design", "research", "prototyping"),
                        List.of("creativity", "empathy"), List.of("creativity", "impact")),
                new Career("entrepreneur", "Entrepreneur", "Test ideas and build an organization around a real need.",
                        List.of("business", "leadership", "problem solving"), List.of("customer research", "communication", "finance"),
                        List.of("initiative", "resilience"), List.of("independence", "impact")),
                new Career("civil-engineer", "Civil Engineer", "Plan and improve built infrastructure with safety in mind.",
                        List.of("engineering", "mathematics", "construction"), List.of("mathematics", "design", "project planning"),
                        List.of("analytical thinking", "attention to detail"), List.of("impact", "responsibility"))
        );
    }
}
