package io.samved;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.samved.opportunity.OpportunityImporter;
import io.samved.opportunity.OpportunityRepository;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/** A reviewed listing can be imported twice without becoming two cards. */
@SpringBootTest
@Transactional
class OpportunityImportTest {
    @Autowired OpportunityImporter importer;
    @Autowired OpportunityRepository listings;
    @Autowired ObjectMapper json;
    @TempDir Path directory;

    @Test
    void reviewedFileIsImportedIdempotently() throws Exception {
        Instant closing = Instant.now().plusSeconds(86400);
        var draft = new OpportunityImporter.Draft("HACKATHON", "Example reviewed event", "Example organizer",
            "SAMVED's original summary.", "https://example.org/apply", "Organizer", "https://example.org/event",
            Instant.now().minusSeconds(60), closing.atZone(java.time.ZoneId.of("Asia/Kolkata")).toLocalDate(), closing,
            "Asia/Kolkata", "Online", "Adults", true);
        Path file = directory.resolve("reviewed.json");
        Files.writeString(file, json.writeValueAsString(new OpportunityImporter.Draft[] { draft }));

        importer.importFile(file);
        importer.importFile(file);

        assertThat(listings.findBySourceUrl("https://example.org/event")).isPresent();
        assertThat(listings.count()).isEqualTo(1);
    }
}
