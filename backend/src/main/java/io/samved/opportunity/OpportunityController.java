package io.samved.opportunity;

import io.samved.common.ApiException;
import io.samved.common.StudentContext;
import io.samved.common.StudentProfilePort;
import io.samved.common.StudentSnapshot;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/v1/opportunities")
public class OpportunityController {
    private final OpportunityRepository repository;
    private final StudentContext context;
    private final StudentProfilePort profiles;
    public OpportunityController(OpportunityRepository repository, StudentContext context, StudentProfilePort profiles) {
        this.repository = repository; this.context = context; this.profiles = profiles;
    }

    @GetMapping
    public OpportunityPage list(@RequestParam(required = false) String type,
                                      @RequestParam(defaultValue = "false") boolean includeExpired,
                                      @RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size) {
        long studentId = context.requireStudentId();
        if (page < 0 || size < 1 || size > 50) throw ApiException.badRequest("Invalid page or size");
        String normalizedType = type == null || type.isBlank() ? null : type.trim().toUpperCase();
        if (normalizedType != null && !List.of("INTERNSHIP", "HACKATHON", "SCHOLARSHIP", "COURSE", "EVENT", "JOB", "COMPETITION", "QUIZ", "WORKSHOP").contains(normalizedType))
            throw ApiException.badRequest("Unknown opportunity type");
        LocalDate today = LocalDate.now();
        Instant now = Instant.now();
        Instant oldestReview = Instant.now().minus(30, ChronoUnit.DAYS);
        Specification<Opportunity> filter = (root, query, cb) -> {
            List<Predicate> clauses = new ArrayList<>();
            clauses.add(cb.isTrue(root.get("published")));
            // A listing disappears from the active feed if nobody has checked it recently.
            if (!includeExpired) clauses.add(cb.greaterThanOrEqualTo(root.get("verifiedAt"), oldestReview));
            if (normalizedType != null) clauses.add(cb.equal(root.get("type"), normalizedType));
            // Unknown deadlines remain visible but are marked as such; known expired ones can be hidden.
            if (!includeExpired) clauses.add(cb.or(
                cb.and(cb.isNotNull(root.get("closesAt")), cb.greaterThanOrEqualTo(root.get("closesAt"), now)),
                cb.and(cb.isNull(root.get("closesAt")), cb.or(cb.isNull(root.get("deadline")),
                    cb.greaterThanOrEqualTo(root.get("deadline"), today)))));
            return cb.and(clauses.toArray(new Predicate[0]));
        };
        // Christa's profile is required for ordering; until integration, keep the public catalogue usable.
        StudentSnapshot profile = null;
        try { profile = profiles.snapshot(studentId); }
        catch (ApiException error) {
            if (!"DEPENDENCY_UNAVAILABLE".equals(error.code())) throw error;
        }
        // Rank a bounded recent candidate pool, then paginate the ranked results.
        List<Opportunity> candidates = repository.findAll(filter,
            PageRequest.of(0, 1000, Sort.by(Sort.Order.desc("verifiedAt"), Sort.Order.asc("id")))).getContent();
        StudentSnapshot student = profile;
        List<OpportunityView> ranked = candidates.stream()
            .map(row -> view(row, OpportunityMatcher.match(row, student), today, now))
            .sorted(Comparator.comparingInt(OpportunityView::matchScore).reversed()
                .thenComparing(OpportunityView::verifiedAt, Comparator.reverseOrder())
                .thenComparingLong(OpportunityView::id))
            .toList();
        long from = (long) page * size;
        int start = (int) Math.min(from, ranked.size());
        int end = (int) Math.min(from + size, ranked.size());
        return new OpportunityPage(ranked.subList(start, end), page, size, ranked.size(),
            (ranked.size() + size - 1) / size);
    }

    private OpportunityView view(Opportunity row, OpportunityMatcher.Match match, LocalDate today, Instant now) {
        return new OpportunityView(row.getId(), row.getType(), row.getTitle(), row.getOrganizer(),
            row.getSummary(), row.getApplicationUrl(), row.getSourceName(), row.getSourceUrl(),
            row.getVerifiedAt(), row.getDeadline(), row.getClosesAt(), row.getDeadlineZone(),
            row.getLocation(), row.getEligibility(),
            row.getClosesAt() != null ? row.getClosesAt().isBefore(now)
                : row.getDeadline() != null && row.getDeadline().isBefore(today),
            match.score(), match.matchedSignals());
    }

    public record OpportunityView(long id, String type, String title, String organizer, String summary,
                                  String applicationUrl, String sourceName, String sourceUrl,
                                  java.time.Instant verifiedAt, LocalDate deadline, Instant closesAt,
                                  String deadlineZone, String location,
                                  String eligibility, boolean expired, int matchScore,
                                  List<String> matchedSignals) {}
    public record OpportunityPage(List<OpportunityView> content, int page, int size,
                                  long totalElements, int totalPages) {}
}
