# Developer A QA evidence — 13 October 2026

**Current update, 14 October 2026:** The 20-test result below is historical. The latest full local Java run passed **35 tests, zero failures or errors, with two opt-in live tests skipped** against H2 after the NVIDIA NIM and Parse roadmap integrations. A separate NVIDIA request with a synthetic profile returned career-ID JSON. The opt-in Java Parse test returned 99 roadmap summaries, and the opt-in NVIDIA test produced five milestones for a synthetic role. MySQL, Christa's auth/profile module, and the complete browser journey remain unverified; see `DEVELOPER_A_FEATURE_UPDATE_2026-10-14.md` and `backend/README.md` for current details.

## What passed

- Java 17 and Maven 3.9.11: `mvn -f backend/pom.xml verify` completed. **20 Java tests**, zero failures or errors.
- Spring application context starts against H2. The Java Flyway V1 migration runs, Hibernate `validate` accepts the migrated tables, and the original career catalogue seeds.
- Browser-shaped API tests: a second signed-in test student gets 404 when changing the first student's task; their task list is empty. A passed exact opportunity deadline disappears from the default feed.
- The JAR contains `BOOT-INF/classes/static/index.html`, `dashboard/index.html`, and the shared frontend API helper.
- `node --check`: **21 JavaScript files**, zero syntax failures.
- Local link check: **19 HTML pages**, **215 local `href`/`src` references**, zero missing.
- A case-insensitive search found no Sonar Shield references in the SAMVED backend, merged frontend, and current handoff/planning documents.

## Evidence limits and current gate

The tests use H2 because MySQL is not installed on this workstation. MySQL migration/runtime behavior is unverified. Christa's real auth/profile implementation is not present, so the login/profile pages still use prototype browser storage and the full registration-to-guidance journey cannot pass against real sessions. The `StudentProfilePort` intentionally returns 503 until she provides it. `backend/README.md` and `backend/API_CONTRACT.md` specify the integration seam. The two reviewed opportunity examples are date-sensitive and require a fresh check before import.

**Phase status:** Developer A implementation and isolated QA passed. Auth/profile integration, MySQL QA, accessibility review, and real-user release checks remain open. No real student data should be entered yet.
