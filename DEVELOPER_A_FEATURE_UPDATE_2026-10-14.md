# SAMVED feature update — 14 October 2026

**Later update:** The public roadmap explorer now calls Java endpoints backed by the user's Parse `roadmap.sh API`. Exact role titles return real roadmap.sh paths; missing titles use the existing NVIDIA `gpt-oss-20b` integration for five clearly labelled starter milestones. Live Java calls returned 99 Parse summaries and a five-step synthetic AI roadmap; `mvn verify` passed with 35 ordinary tests and two opt-in live tests skipped. The dated 27-test result below is earlier evidence.

## Changes

- AI career ranking: `AiRecommendationService` uses NVIDIA NIM's `openai/gpt-oss-20b` chat API only when `SAMVED_NVIDIA_API_KEY` is configured on the Java server. The model may select and order candidates from the original career catalogue. Java checks the IDs and preserves rule-based scores, reasons and gaps. The response reports `AI`, `RULES` or `RULES_FALLBACK`.
- Roadmap resource links: software, data and design roadmaps expose direct links to relevant roadmap.sh pages. SAMVED keeps its own milestone text and progress. The roadmap.sh content is not copied into SAMVED.
- Opportunity relevance: the feed orders reviewed active listings using the signed-in student's persisted interests, skills and goal. Matching signals appear in the API and frontend. Approved JSON feed URLs can be polled by a Java scheduler if configured; no Unstop, HackCulture or Devfolio vendor feed is connected yet.
- Task reminders: Java Flyway V2 adds student-owned in-app notifications. Due tomorrow, due today and overdue tasks create reminders. The server scans hourly, and reading the notification API also refreshes that student's reminders. Students can mark reminders read. Completing, changing or deleting a task clears its old reminders. The dashboard and deadline page now use these APIs.

## Verification

- `mvn -f backend/pom.xml verify`: **27 Java tests, 0 failures or errors**, packaged JAR built. Tests included Flyway V1/V2 and Hibernate validation against H2, private reminder creation and isolation, AI provider mocks, opportunity matching, and existing Developer A behavior.
- `node --check`: **21 JavaScript files**, 0 syntax errors.
- Local reference check: **19 HTML pages, 214 href/src references, 0 missing**.

## Open gates

- The Java migrations and full application still need a MySQL run.
- Christa's real auth, session, CSRF and profile adapter are needed before a complete student browser journey can work.
- A live NVIDIA NIM call using a synthetic profile returned the expected career-ID JSON. The signed-in student API still needs Christa's profile integration and student disclosure before real use. The trial call does not establish production availability or billing.
- No official syndication feed or reuse agreement was verified for Unstop, HackCulture or Devfolio. Automatic vendor imports need such a feed or agreement; the current scheduler only processes explicitly configured authorized JSON feeds.
- In-app reminders work while the server runs. Email, SMS and background browser push are not implemented.
- Full browser, accessibility, MySQL, and release checks remain before real users.
