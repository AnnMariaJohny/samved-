# Automatic personalized dashboard — 2026-10-16

## Implemented behavior

- AI now returns bounded career preference-match percentages and explanations, separately from the original deterministic overlap score. Both dashboard and recommendation cards identify AI estimates or profile-based fallbacks. These percentages do not measure employment probability.
- Completing onboarding prepares four services: career recommendations, learning paths, opportunity matches and the seven-day action plan.
- NVIDIA NIM receives bounded onboarding signals (including skill proficiency, courses, subjects and assessment themes) and generates seven learning activities. Account identity is excluded. Java validates output, assigns dates and saves real tasks in MySQL.
- Dashboard prioritizes the plan, next actions, completion ring, weekly chart and dated schedule. Daily Tasks, Planner and Deadlines display the same records. Completing a dashboard action refreshes persisted progress immediately.
- One activity is scheduled per day for seven days. Existing plans are reused. Expired weeks renew at 00:10 Asia/Kolkata or on the next dashboard/task/progress visit. Refreshing or opening multiple tabs does not duplicate tasks.
- On profile changes, future pending automatic assignments are replaced. Completed, in-progress, overdue, student-edited and manually created tasks are preserved. Removing an assignment does not immediately recreate it.
- Provider failures produce an explicitly labelled guided starter week; the stored week is reused rather than repeatedly calling AI on refresh. New AI plan attempts have a server-wide hourly cap.
- Dashboard shows up to five positive relevance matches from the real opportunity feed. Goal-related keywords expand supported research/science/software/design searches. Duplicate normalized signals are counted once. No opportunities are fabricated.
- Flyway V6 adds automatic-task provenance and the saved plan table. Account deletion removes both tasks and the plan. CSRF and server-side onboarding/ownership checks apply to plan creation.

## Verification

- 29 targeted Java tests passed across planning, concurrent requests, identity isolation, CSRF, onboarding enforcement, replanning preservation, weekly renewal, guided fallback, deletion, migration validation, AI output validation, opportunity ranking, recommendations and reminders. Counts are recorded in `action-plan-java-result.json`.
- Existing browser checks: 165 source-page/API checks and 27 guided onboarding checks passed.
- Responsive audit: 171 checks passed across 27 pages at 390, 900 and 1440 px, including preparation success/error/fallback and reduced motion.
- A provider response timeout was observed during verification. Career analysis now allows 45 seconds for the larger AI match response; failures still use the labelled fallback.
- Live test `action_plan_live.py`: disposable Research Scientist account, real NVIDIA AI and MySQL. Verified seven dated tasks, no refresh duplicates, AI match percentages, shared task pages, dashboard charts and 14% progress after completing one of seven tasks. Temporary account deleted after verification.
- Reviewed desktop/mobile screenshots in `action-plan-live-dashboard.png` and `action-plan-live-mobile.png`.

The daily plan is learning guidance. External opportunities are ranked by Java relevance rules; the AI does not invent or submit applications.

VERDICT: PASS
