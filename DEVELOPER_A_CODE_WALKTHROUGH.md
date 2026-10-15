# Read Developer A's Java code in this order

This guide is for learning the implementation, not just running it. The backend logic and database migration are Java. Maven XML and `.properties` only configure the build and runtime. The existing frontend is still HTML/CSS/JavaScript because browsers need those languages.

## 1. How a request knows whose data to use

Open `backend/src/main/java/io/samved/common/StudentContext.java`. `requireStudentId()` checks Spring Security authentication, then reads `samvedStudentId` from the **server session**. It rejects a missing or invalid value. The browser never sends `studentId` in a request body to select its owner. Christa will set this session value after a real login. Until her code is present, private routes return 401.

`StudentProfilePort.java` is a small bridge: Developer A's modules ask it for a read-only `StudentSnapshot`. Christa implements that bridge from her MySQL profile rows. `PendingStudentProfilePort` returns 503 while the bridge is absent, preventing fake profile guidance. `ApiException` and `ApiErrors` turn deliberate validation/auth failures into stable JSON errors.

## 2. Assessment

`assessment/AssessmentCatalog.java` contains eight versioned questions. Each option has an ID and a descriptive dimension; the confidence question has no dimension. `AssessmentService.submit()` first checks the signed-in student, validates that all current questions are answered exactly once, then replaces that student's stored versioned answers in one transaction. `result()` counts selected dimensions from stored answers and returns the leading dimensions. The comment in that method explains why the counts are descriptive signals, not a career prediction. `AssessmentController` exposes the three HTTP routes.

## 3. Career suggestions

`career/CareerSeed.java` inserts eight small, original career entries only when missing. `recommendation/RecommendationController.java` loads the authenticated student's profile and, if completed, their assessment themes. `RecommendationService.java` normalizes strings, matches stated interests/skills/strengths/values, adds a small bonus for a leading assessment theme, and sorts by score with a stable tie-break. Its `RULE_VERSION` lets you explain which rules produced a suggestion. Each result lists the exact matched skills, missing skills and reasons. Scores are rule-based guidance, not probabilities of success.

If a student says they are exploring, the code does not silently assign a career. If there are no profile or assessment signals, it returns an empty suggestion list with a plain explanation. Add or change scoring rules only with a new rule version and a test that shows the resulting difference.

## 4. Roadmaps and progress

`roadmap/RoadmapService.java` defines original three-step starter templates for the eight launch careers and an exploration path. `create()` uses the session owner, checks the template code, returns an existing plan for a repeated request, then saves the roadmap and an ordered copy of its milestones. Saved milestones are a snapshot: future template edits do not rewrite a student's completion history. `updateMilestone()` checks that the milestone's roadmap belongs to the signed-in student before changing status.

`task/LearningTaskService.java` validates title and optional links to a student's own roadmap/milestone. Create, edit, status change and delete all scope the task to the session owner. `progress/ProgressController.java` counts saved completed milestones and tasks, then calculates a percentage. When the total is zero, it returns `0`, avoiding division by zero and a misleading 100%.

## 5. Opportunities and database

`opportunity/OpportunityController.java` reads only published listings, filters by type, hides passed deadlines, and hides records not checked for over 30 days. `OpportunityImporter.java` runs only when `SAMVED_OPPORTUNITY_IMPORT` points to a reviewer-prepared JSON file. It validates every draft before saving, checks HTTPS URLs, and updates an existing listing by source URL. The two time-sensitive reviewed examples live outside the backend in `curation/`; re-check them before importing. There is no scraper or automatic Google/Unstop/HackCulture feed.

`db/migration/V1__developer_a_schema.java` creates the Developer A tables through Flyway using Java code. `application.properties` uses environment variables for MySQL and asks Hibernate to **validate** the schema. It does not use `ddl-auto=update` in normal operation. `DeveloperADataDeletion.deleteForStudent()` removes this module's private rows in foreign-key order; Christa must call it during account deletion.

## 6. Frontend and tests

Maven packages `frontend/` under Spring Boot's static resources. `frontend/api/developer-a-api.js` sends same-origin requests and attaches Christa's CSRF token on writes. The assessment, dashboard, recommendation, roadmap, task, progress and opportunity scripts render server responses with `textContent`, show empty/error states, and wait for confirmed responses before saying a save succeeded.

Tests under `backend/src/test/java/` cover assessment validation and student isolation, deterministic recommendations, progress, roadmap validation, opportunity import, account cleanup, Spring startup, Java Flyway migration plus JPA validation, and the public-page/private-API boundary. Two browser-shaped API tests also check that a second student cannot change the first student's task and that a passed exact opportunity deadline is hidden. On 13 October 2026, `mvn verify` passed **20 Java tests**. These tests use H2; a real MySQL run and a full authenticated browser journey still need Christa's auth/profile code and MySQL.
