# SAMVED frontend merge QA — 13 October 2026

Source: local `frontend` served over HTTP on `127.0.0.1:8000`; Chrome headless through Playwright; desktop viewport 1440 × 900 and mobile viewport 390 × 844. The HTTP server was stopped after testing.

| Check | Result |
| --- | --- |
| JavaScript syntax | 20/20 files pass `node --check` |
| Local HTML references | 19 HTML pages, 211 local `href`/`src` references, 0 missing |
| Registration/login navigation | Root → register → login → profile passed with disposable test values |
| Profile handoff | Name, undergraduate education and Software Engineer goal appeared on dashboard; return to profile passed |
| Assessment navigation | Assessment → dashboard passed at 1440 px and 390 px |
| Other education | Dashboard showed “Other / exploring” and 0% label rather than Bachelor's |
| Career pages | All eight pages loaded at both viewports with one profile nav link and no JavaScript page errors |
| Dashboard layout | No document-level horizontal overflow; mobile layout inspected visually after responsive fix |

Screenshots: [desktop](dashboard-desktop.png), [mobile](dashboard-mobile.png). Captures were taken after the progress-bar transition ended; the 0% fill and label agree.

**Not covered:** assessment form submission, all profile form controls, task/deadline persistence, every screen's responsive layout, accessibility audit, Java API/DB, security, performance, deployment. Real-user release remains blocked, primarily by plaintext browser-stored passwords and absent backend persistence.
