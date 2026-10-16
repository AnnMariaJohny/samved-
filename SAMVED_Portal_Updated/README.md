# Active SAMVED frontend

`JAVA PROJECT OOP/` is the only frontend source used by `backend/pom.xml`. Its own page layouts, header, navigation, illustrations, and styles are served by Spring Boot. The sibling `frontend/` directory is not an input to the build.

Double-click `../Start SAMVED.cmd`, or run this from the repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1
```

The launcher starts the local MySQL service if necessary, runs `clean package`, starts Java, and opens `http://127.0.0.1:8080/login.html`. Existing database accounts and saved data remain in MySQL.

## Page and API map

All API paths below start with `/api/v1/`. `portal-app.js` supplies the integration for these source HTML pages; `api/developer-a-api.js` handles sessions and CSRF. No prototype login or browser-storage save scripts are loaded.

| Source page in JAVA PROJECT OOP | Connected backend |
| --- | --- |
| `login.html`, `register.html` | `auth/login`, `auth/register`, `auth/csrf`, onboarding redirect |
| `onboarding/index.html` | Required ordered checklist and resume; full feature navigation stays hidden |
| `onboarding/prepare.html` | Automatic career ranking/skill gaps, roadmap guidance and opportunity matching, then dashboard redirect |
| `profile/index.html` | `students/me`, `auth/password`, account deletion |
| `profile completion/index.html` | `students/me/onboarding` |
| `academic-details/index.html` | `students/me/academics`, records and subjects |
| `interests/index.html` | `students/me/interests` |
| `skills/index.html` | `students/me/skills`, saved proficiency |
| `strengths/index.html`, `values/index.html` | Corresponding saved profile selections |
| `career-goal/index.html` | `students/me`, `students/me/review/career` |
| `assessment/index.html`, `form assessment/index.html` | Current questions, responses, and career assessment result |
| `dashboard/index.html` | Account, progress, tasks, reminders, and links to working features |
| `career roadmap/index.html` | Catalogue, guidance, saved preferences, native graph/topic viewer, starter roadmaps, milestone updates, custom role discovery |
| `daily tasks/index.html` | Task create/read/edit/complete/delete |
| `planner/index.html`, `deadline system/index.html` | Dated tasks and in-app reminders |
| `progress tracker/index.html`, `charts/index.html` | Saved progress, skills and academic scores |
| `activities/index.html`, `oppertunity page/index.html` | Verified opportunity feeds and type filters |
| `recommondation page/index.html` | Saved-profile career guidance, reasons and skill gaps |
| `journal/index.html` | Displays the current backend limitation; there is no journal API or fake save |
| `welcome.html`, `index.html`, `privacy.html` | Public entry and privacy notice |

`portal-page-index.json` lists the 25 integrated source pages, including `onboarding/index.html` and `onboarding/prepare.html`. `portal-routes.json` maps 13 previous URLs (including `/profile/profile.html`, `/profile/academic.html`, and `/auth/login.html`) to these source pages. Compatibility HTML files only redirect to the new locations.

Incomplete accounts follow the required step order described in `../ONBOARDING_FLOW.md`. The feature sidebar is hidden during setup. `portal-onboarding.js` supplies the wizard, automatic recommendation/opportunity preparation, personalised dashboard panels, and the isolated sample-account shortcut for judges.

Edit this directory, stop SAMVED, and reopen the launcher to rebuild. Old prototype `script.js`, `profile.js`, `portal-nav.js`, and `portal-logout.js` files are excluded from packaging. Their mock actions are replaced by the live integration.

Browser verification: `QA_EVIDENCE/updated_portal_check.py` tests these pages with an API fixture. `QA_EVIDENCE/updated_portal_live.py` creates and deletes a disposable account to check real Java/MySQL persistence.
