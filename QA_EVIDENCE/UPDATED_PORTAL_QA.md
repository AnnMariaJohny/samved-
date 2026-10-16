# Updated portal UI verification

Date: 2026-10-16

## Result

- Loaded all 17 active private pages at desktop and 390 px mobile widths. All displayed the updated portal shell; no JavaScript exceptions or mobile horizontal overflow appeared.
- Passed 64 browser interaction checks using a stateful mock of the documented `/api/v1` routes. The checks include login, registration, profile and academic changes, interests, skills, strengths, values, career goal, assessment, roadmap catalogue/graph/preferences, task creation/edit/completion/deletion, deadlines, reminders, opportunity filters and links, recommendations, charts, navigation, logout, and account deletion.
- Passed three error-state checks: bad login, expired session, and incomplete onboarding.
- `node --check` passed for all 31 frontend JavaScript files.
- Confirmed the API routes used by these UI flows exist in the Spring controllers.

## Fix made

The active Career Roadmap page still displayed a hard-coded scientist goal and a “Demo data” note. Its heading now says “Your career roadmaps”; the content below comes from the saved roadmap API.

## Scope and limits

The browser checks use controlled API responses to verify UI wiring. They do not prove that MySQL saves records or that the Java server starts on this machine. Java, Maven, MySQL, and the local `.tools` runtime were not available during this check, so `mvn verify` and live account testing could not run.

The optional external catalogue, AI roadmap/recommendation provider, and live opportunity feeds also need configured provider keys or source data for an end-to-end test. The extra prototype-only screens for activities, journal, planner, standalone milestones/notifications, and exam gradebook remain outside the active frontend. Password reset by email and profile PDF export are prototype controls without backend features.

## Reproduce the browser checks

From the repository root, start a static server in one terminal:

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory frontend
```

Then, in another terminal:

```powershell
python QA_EVIDENCE/ui_smoke.py
python QA_EVIDENCE/ui_interactions.py
python QA_EVIDENCE/ui_error_states.py
```

The scripts require Python Playwright with Chromium installed. They mock `/api/v1` responses; run the Java application and its Maven tests separately for real persistence verification.
