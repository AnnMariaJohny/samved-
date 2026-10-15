# Personalized roadmaps and survey onboarding — 15 October 2026

**Later change: onboarding is mandatory.** The earlier optional flow described below has been superseded. See [mandatory onboarding evidence](MANDATORY_ONBOARDING.md).

The Software template's three related links no longer define the dashboard's roadmap choices. Dashboard, Career Roadmap and the dedicated viewer now share a personal roadmap hub.

- An eight-section checklist covers personal details, academics, interests, skills, strengths, values, career direction and the eight-question career assessment.
- Existing non-empty answers count as completed. Empty profile sections can be explicitly reviewed without inventing data. An exploring career goal is valid; it must be explicitly confirmed. Assessment completion requires valid answers to every current question.
- Recommendations unlock when all sections are reviewed. Deterministic matching uses interests, skills, strengths, values, stated goal and assessment themes against real catalogue IDs/titles/tags, with explicit aliases and matching reasons. Education is displayed as context; grades do not exclude choices. No unsupported medical or other non-developer roadmaps are fabricated.
- Manual search/browse works before or after survey completion. The current cached catalogue has 99 roadmaps. Users can preview any path, save up to 20 choices, choose an active roadmap and remove a saved choice. Updated recommendations do not overwrite manual choices.
- Saved choices and review markers persist on the authenticated MySQL profile. No client owner ID is accepted. The V5 Java migration adds the two bounded preference columns; account deletion removes them with the profile.

API additions: GET `/api/v1/students/me/onboarding`, PUT `/students/me/review/{section}`, GET `/roadmaps/guidance`, POST `/roadmaps/preferences`, PUT `/roadmaps/preferences/active`, DELETE `/roadmaps/preferences/{slug}` (all routes have the `/api/v1` prefix). Profile responses add `reviewedSections`.

Verification: 61 suite reports, 58 passed, 3 optional provider tests skipped. The six new MySQL-compatible H2 integration tests cover survey readiness, distinct recommendations, explicit empty reviews, mandatory assessment answers, private/idempotent saved choices across login, answer updates, owner-field rejection and provider failure preserving preferences. A ranking tie exposed by a test was corrected to prioritize the specific design path, then all six new tests passed on rerun; the existing tests passed unchanged.

The MySQL browser check covers all 99 choices for a new user, saving Python/Backend before surveys, logout/login persistence, the complete guided survey sequence, research/data recommendations with reasons, changing interests to Design, the shared active choice across pages and a 390px mobile layout. There were no JavaScript errors or document horizontal overflow. Disposable accounts are removed by the browser check. See `personal-roadmaps-result.json`, `personal-roadmaps-desktop.png`, and `personal-roadmaps-mobile.png` for evidence.

The imported roadmap graph is a learning viewer. Existing progress metrics continue to track the original saved milestones and tasks; saving a catalogue choice does not fabricate completed milestones or synchronize a roadmap.sh account.
