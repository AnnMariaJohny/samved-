# BV — interactive backend explorer

Open `/backend-visualization/index.html`, or use **BV** above any portal/public screen. The launcher opens a separate tab and selects the feature related to the original screen, preserving unfinished forms.

## Presentation controls

- Select any of the 17 feature nodes to expand its purpose, data flow, implemented algorithms, API contracts, database tables and fallback/security boundaries.
- **View code** opens actual source excerpts with verified line numbers. **Copy path:line** locates the implementation in an editor; **View on GitHub** opens the repository file at those lines.
- **Follow a flow** offers student onboarding through dashboard, activity completion, and AI planning/duplicate protection. Previous/next and play/pause guide the presentation.
- Animated connections illustrate dependencies; the page explicitly labels the walkthrough as documentation, not live backend traffic. No student/provider APIs run from this page.
- BV is public architecture documentation. Private student APIs retain authentication, CSRF, onboarding and ownership enforcement.

## Source maintenance

`python QA_EVIDENCE/build_backend_map.py` rebuilds `backend-visualization/map-data.js` from explicit source anchors. It verifies each anchor exists exactly once and stores the exact excerpt, line range and source-file hash. Rerun it when referenced code changes. It does not read runtime credentials or student data. The current snapshot has 65 code locations across all 17 features.

The main view and launcher are in `SAMVED_Portal_Updated/JAVA PROJECT OOP/backend-visualization/` and `bv-entry.js`. Existing Maven resources package them with the updated portal. The sole backend behavior change is an exact public documentation-route exemption in `OnboardingAccess.java`.

## Executed verification

- Source generation: 17 features and 65 verified source anchors.
- `backend_explorer_check.py`: 158 checks passed, including all 27 active/public entry screens, context preservation, every feature’s detail/code expansion, code shortcut, walkthrough navigation/play/pause, zero feature API requests, responsive layouts at 390/900/1600 px, and reduced motion.
- Launcher was inserted in all 41 existing HTML documents with bodies, including legacy redirect documents. The active-page entry audit covers the 25 indexed pages plus welcome/privacy.
- `updated_portal_check.py`: 165 existing source-page/API checks passed.
- `WebBoundaryTest`: 3 tests passed, including public BV assets and protected private APIs.
- Desktop/mobile screenshots: `backend-explorer-desktop.png`, `backend-explorer-mobile.png`.

VERDICT: PASS
