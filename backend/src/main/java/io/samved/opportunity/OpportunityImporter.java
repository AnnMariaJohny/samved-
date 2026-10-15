package io.samved.opportunity;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.samved.common.ApiException;
import jakarta.transaction.Transactional;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Loads a reviewed JSON file or validated source-feed records. There is no
 * public write route or guessed "live" opportunity in this module.
 */
@Component
public class OpportunityImporter implements ApplicationRunner {
    private final ObjectMapper mapper;
    private final OpportunityRepository opportunities;

    public OpportunityImporter(ObjectMapper mapper, OpportunityRepository opportunities) {
        this.mapper = mapper;
        this.opportunities = opportunities;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        String source = System.getenv("SAMVED_OPPORTUNITY_IMPORT");
        if (source == null || source.isBlank()) return;
        importFile(Path.of(source).toAbsolutePath().normalize());
    }

    /** Also callable from a controlled maintenance command or a database-backed test. */
    public void importFile(Path file) throws Exception {
        if (!Files.isRegularFile(file)) throw ApiException.badRequest("Opportunity import file does not exist.");
        importJson(Files.readAllBytes(file));
    }

    /** Trusted partner feed bytes use the same validation and upsert path as reviewed files. */
    @Transactional
    public void importJson(byte[] json) throws Exception {
        Draft[] records = mapper.readValue(json, Draft[].class);
        if (records == null || records.length > 500)
            throw ApiException.badRequest("Opportunity feed must contain at most 500 listings.");
        List<Draft> drafts = Arrays.asList(records);
        // Validate the whole batch before making any database change.
        drafts.forEach(this::validate);
        for (Draft draft : drafts) {
            Opportunity row = opportunities.findBySourceUrl(draft.sourceUrl()).orElse(null);
            if (row == null) {
                opportunities.save(new Opportunity(draft.type(), draft.title(), draft.organizer(),
                    draft.summary(), draft.applicationUrl(), draft.sourceName(), draft.sourceUrl(),
                    draft.verifiedAt(), draft.deadline(), draft.closesAt(), draft.deadlineZone(),
                    draft.location(), draft.eligibility(), draft.published()));
            } else {
                row.revise(draft.type(), draft.title(), draft.organizer(), draft.summary(), draft.applicationUrl(),
                    draft.sourceName(), draft.verifiedAt(), draft.deadline(), draft.location(),
                    draft.closesAt(), draft.deadlineZone(), draft.eligibility(),
                    draft.published());
            }
        }
    }

    private void validate(Draft draft) {
        if (draft == null || draft.type() == null || !List.of("INTERNSHIP", "HACKATHON", "SCHOLARSHIP", "COURSE", "EVENT", "JOB", "COMPETITION", "QUIZ", "WORKSHOP").contains(draft.type()))
            throw ApiException.badRequest("Opportunity type is invalid.");
        bounded(draft.title(), 180, "title");
        bounded(draft.organizer(), 120, "organizer");
        bounded(draft.summary(), 500, "summary");
        bounded(draft.sourceName(), 100, "source name");
        bounded(draft.sourceUrl(), 700, "source URL");
        bounded(draft.applicationUrl(), 1000, "application URL");
        https(draft.sourceUrl());
        https(draft.applicationUrl());
        if (draft.verifiedAt() == null || draft.verifiedAt().isAfter(Instant.now()))
            throw ApiException.badRequest("Verification date is missing or in the future.");
        if (draft.published() && draft.verifiedAt().isBefore(Instant.now().minusSeconds(30L * 24 * 3600)))
            throw ApiException.badRequest("Published opportunities need a review within 30 days.");
        if (draft.closesAt() != null && draft.deadlineZone() == null)
            throw ApiException.badRequest("An exact deadline needs a timezone.");
        if (draft.deadlineZone() != null) {
            try {
                java.time.ZoneId zone = java.time.ZoneId.of(draft.deadlineZone());
                if (draft.closesAt() != null && draft.deadline() != null
                    && !draft.closesAt().atZone(zone).toLocalDate().equals(draft.deadline()))
                    throw ApiException.badRequest("Deadline date and exact closing time disagree.");
            }
            catch (ApiException error) { throw error; }
            catch (Exception error) { throw ApiException.badRequest("Deadline timezone is invalid."); }
        }
        if (draft.location() != null && draft.location().length() > 100) throw ApiException.badRequest("Location is too long.");
        if (draft.eligibility() != null && draft.eligibility().length() > 1000) throw ApiException.badRequest("Eligibility is too long.");
    }

    private void bounded(String value, int max, String field) {
        if (value == null || value.isBlank() || value.length() > max)
            throw ApiException.badRequest("Opportunity " + field + " is missing or too long.");
    }

    private void https(String value) {
        try {
            URI uri = URI.create(value);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null)
                throw ApiException.badRequest("Opportunity links must use HTTPS.");
        } catch (IllegalArgumentException error) {
            throw ApiException.badRequest("Opportunity link is invalid.");
        }
    }

    public record Draft(String type, String title, String organizer, String summary, String applicationUrl,
                        String sourceName, String sourceUrl, Instant verifiedAt, LocalDate deadline,
                        Instant closesAt, String deadlineZone, String location, String eligibility,
                        boolean published) { }
}
