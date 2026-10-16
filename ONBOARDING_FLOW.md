# SAMVED student journey

The active frontend remains `SAMVED_Portal_Updated/JAVA PROJECT OOP/`.

## Normal student flow

1. Register or sign in. An incomplete account opens `/onboarding/index.html`.
2. Review personal details: name, education level, optional city/region. Registration already saves the required personal fields.
3. Education: save at least one academic record with a subject and valid marks.
4. Career direction: enter a goal or explicitly choose to keep exploring.
5. Interests: save at least one selection.
6. Skills: save at least one skill and its proficiency.
7. Strengths: save at least one selection.
8. Values: save at least one selection.
9. Assessment: answer all eight current career questions and submit them together.
10. `/onboarding/prepare.html` automatically requests career ranking/skill gaps, roadmap guidance, and matched opportunities, then opens `/dashboard/index.html`.

The eight checklist sections are personal details, education, career direction, interests, skills, strengths, values, and assessment. The welcome and preparation screens are outside that count.

During onboarding, the full feature menu is replaced with a numbered step list. Students can revisit earlier steps. Future steps redirect to the first unfinished section, and private feature APIs return `403 ONBOARDING_REQUIRED` until all required data exists. There is no normal Skip button. Academic and skill pages allow multiple saved records before Continue. Other steps use Save & Continue. Removing the final saved academic record or skill disables Continue again. Saved progress survives sign-out; the next login resumes the first unfinished section.

## Automatic dashboard preparation

The dashboard automatically loads career suggestions with their reasons and skill gaps, recommended learning paths, and verified opportunity matches. An available NVIDIA key enables the configured AI ranking layer; the UI states when rules or a provider fallback supplied the result. A missing catalogue or opportunity feed does not create sample listings. Each unavailable dashboard section offers a retry.

Career rankings are cached within the authenticated server session for ten minutes when AI succeeds, or one minute for rule/fallback results. A changed profile or assessment theme recomputes the ranking. Login rotation keeps results separated by session and account. The preparation screen and dashboard can reuse the ranking instead of calling AI twice for identical inputs.

Suggested paths are shown automatically. Students choose which roadmap to save or activate; normal onboarding does not invent completed tasks, milestones, or career readiness.

## Judge demo shortcut

Use **Skip to judge demo** on login/registration, or **Skip onboarding — judge demo** in onboarding. The dialog explains the sample profile and asks for adult/privacy confirmation. It signs into a separate generated sample student account, saves valid sample answers through the normal APIs, and runs the same preparation flow. The server onboarding gate has no demo bypass.

The dashboard is visibly labelled **Judge demo · sample student**. It contains a sample software roadmap and one pending sample task; opportunity listings and AI results still come from the real configured services. The original student's saved profile is untouched. Exit demo or sign-out deletes the sample account and its data. Closing the browser without exiting does not delete the sample account.

## Verification

- `QA_EVIDENCE/onboarding_flow_check.py`: stateful browser checks for required order, saved-data validation, mobile layout, automatic preparation, and provider failure handling.
- `QA_EVIDENCE/onboarding_live.py`: real Java/MySQL checks for the complete student journey, isolated judge demo, restoration of the original student's incomplete profile, actual AI source, and disposable-account cleanup.
- Backend tests cover page/API gating, account security, and session-specific recommendation caching.
