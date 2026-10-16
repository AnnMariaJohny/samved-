# Guided onboarding verification

Verified 16 October 2026 using the active `SAMVED_Portal_Updated/JAVA PROJECT OOP/` source.

## Behavior

Registration and incomplete-account login open the onboarding welcome. Required
order: personal details, education, career direction, interests, skills,
strengths, values, and all eight assessment questions. The feature sidebar is
replaced by the onboarding steps. Later pages redirect to the first unfinished
step; feature APIs remain blocked until the full checklist is complete.

The last saved assessment opens automatic preparation, then the dashboard.
Career ranking/skill gaps, roadmap suggestions, and verified opportunities load
automatically. The display identifies the actual AI/rules source and offers a
retry for unavailable data. An AI response is reused within its owning session;
changed profile inputs invalidate it.

The judge shortcut creates a separate sample account through normal APIs. It
does not bypass the backend gate or overwrite the signed-in student's answers.
The demo is labelled and its pending sample task is not presented as completed
work. Exiting the demo deletes the sample account.

## Observed evidence

- 19 Java tests passed: AccountIntegrationTest (9), PersonalRoadmapIntegrationTest
  (7), WebBoundaryTest (2), RecommendationSessionTest (1). Zero failures/errors/skips.
- 27 stateful browser checks passed in `onboarding_flow_check.py`, including
  locked future steps, empty selections, saved-data resume, re-locking after
  deleting a final record/skill, all eight answers, mobile layout, automatic
  preparation, and usable dashboard retries after a provider failure.
- The general updated-portal browser verification passed 165 checks across
  25 source pages.
- 22 live Java/MySQL checks passed in `onboarding_live.py` after the final build.
  Both the real student flow and isolated demo were exercised. The original
  student's incomplete profile was restored unchanged after demo exit. Both
  disposable accounts were deleted.
- The real configured NVIDIA ranking response returned `source=AI`; the
  personalised dashboard displayed the AI source label.

Screenshots: `onboarding-live-welcome.png`, `guided-onboarding-mobile.png`,
`onboarding-live-demo-dashboard.png`, `onboarding-live-personal-dashboard.png`.
Structured results: `guided-onboarding-result.json` and `onboarding-live-result.json`.

External feed availability remains independent of the flow. Empty real feeds
are shown as empty; no listings or completed progress are invented.

VERDICT: PASS
