# Actual updated portal replacement

Verified on 16 October 2026. The previous styling-only adapter is retired.

- Maven resource input: `../SAMVED_Portal_Updated/JAVA PROJECT OOP` only.
- 23 source pages indexed; 13 previous URLs mapped to the updated pages.
- `portal-shell.js` and `portal-theme.css` absent from clean packaged output.
- Live `/portal-shell.js` returns 404; `/login.html` contains the new source marker.
- `updated_portal_check.py`: 153 browser checks passed across all 23 pages with
  an API fixture, including mobile layout and saved-data interactions.
- `WebBoundaryTest` and `PersonalRoadmapIntegrationTest`: 8 tests passed, zero
  failures, errors, or skips. These cover public pages and incomplete-user setup
  routes while retaining private feature/API restrictions.
- `updated_portal_live.py`: 15 browser checks passed against the running Java app
  and MySQL. Registration/login, academics with subjects, interests, strengths,
  values, skills, career review, assessment, completed onboarding, task edits and
  completion, old bookmark mapping, logout, login again, and account deletion.
  The disposable verification account was deleted after the run.
- Live health endpoint: UP.

Browser fixtures verify deterministic UI wiring. The live test verifies actual
persistence and sessions. External provider availability is not implied by these
results. Journal has no API in the existing backend and displays that limitation
instead of a fake save or sample records.

Screenshots: `actual-updated-live-profile.png`, `actual-updated-academic-desktop.png`,
`actual-updated-academic-mobile.png`, `actual-updated-dashboard-desktop.png`.
