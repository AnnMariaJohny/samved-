# SAMVED — Developer A's build plan and local frontend guide

**13 October 2026.** This is the plan for Developer A (you). Christa's auth and student-data work is specified in `FRIEND_AUTH_PROFILE_HANDOFF.md`. The merged frontend is in `frontend/`; `Eva/` and `anm/` remain source copies. The current site is a browser-only prototype, so use disposable details when previewing it.

## In plain language

You build the part of SAMVED that turns a student's answers into useful guidance: assessment, career suggestions with reasons, a personal roadmap, tasks and progress, and a carefully checked opportunity list. Christa builds the secure account and profile foundation you consume. You also set up the shared Java project and connect the finished frontend to the API. Keep the 60/40 split in `SAMVED_BACKEND_PLAN.md` as a planning target; integration and release are your responsibility.

**A roadmap** is SAMVED's own ordered plan for a student's goal, with milestones that can be completed and tracked. roadmap.sh can be an *external learning resource* for suitable technology goals. Its content is not a dataset to import into SAMVED. Its [About page](https://roadmap.sh/about) explicitly disallows redistribution; its [terms](https://roadmap.sh/terms) also restrict copying and scraping. Use a permitted link or sharing feature without implying a partnership, and ask roadmap.sh for written permission before any content integration. Create original SAMVED roadmap templates, including for non-technology careers that roadmap.sh does not cover.

**An opportunity** is a real internship, hackathon, scholarship, competition, or course with an application link. For the MVP, SAMVED should curate a small, checked list and send students to the original application page. Google search is a *discovery method*, not the source of truth or an automatic feed. Unstop and HackCulture are places to find candidates, but their listings should not be scraped or republished wholesale without permission. I did not verify a public import API or syndication license for either. Manually record a short, original summary and link to the original listing or organizer; obtain permission before building automatic importers.

## What to build, in order

| Step | Your deliverable | Done when |
| --- | --- | --- |
| 1. Shared foundation | `backend/` Spring Boot + Maven, MySQL config from environment, Flyway migrations, common error response, `/api/v1` prefix, health endpoint, CI build | Clean clone builds and starts with local MySQL; no secret is committed |
| 2. Contract with Christa | Agree user/profile key, `StudentSnapshot` (education, interests, skills, strengths, values, goal), session/CSRF behavior and DTO examples | Both modules use the same IDs, types and auth conventions; no client owner ID is trusted |
| 3. Assessment | Versioned questions, validated answers and reproducible result | Save answers, reload, calculate the same result; invalid or other-user requests fail |
| 4. Career guidance | Career catalogue, required skills, explainable rule-based ranking and gaps | Each recommendation shows reasons, matched factors, missing skills and rule version; exploring goal gets an honest response |
| 5. Roadmaps and tasks | Original career templates → student roadmap snapshot → milestones/tasks with persistent status | Same student's progress survives reload; other student cannot modify it; zero tasks shows 0% plus an empty state |
| 6. Opportunities | Curated records, filters, expiry and source links | Only checked, current items appear as active; every card has source, checked date, deadline state and apply link |
| 7. Frontend integration | Replace demo auth, demo career data, fake progress and hard-coded opportunities with API calls | Register → profile → assessment → guidance → roadmap → task → opportunity works against Java + MySQL |

Use the detailed API sketch and ownership points in `SAMVED_BACKEND_PLAN.md`. Work in small slices: one migration, API, tests, and frontend wiring for a feature before moving to the next. Christa owns `auth/`, `security/`, `student/` and their frontend forms; you own the rest and shared application setup.

## Roadmap design

Create original `career_templates` and `template_milestones` for the careers SAMVED actually displays. Each milestone needs a title, plain-language outcome, order, approximate effort and optional **resource link**. Generate a student's roadmap from the chosen goal, education and known skills; copy the template into student-owned roadmap rows so later template edits do not silently rewrite their progress. For an uncertain goal, offer exploration milestones such as comparing careers and trying one small project instead of pretending the student has selected a career. Let users mark milestones complete; calculate progress from stored completed/total counts. Keep resource links clearly labelled as external.

For a tech goal, you may offer a roadmap.sh **link** using its provided sharing mechanism. Do not copy its nodes, text, images, diagrams or JSON into SAMVED. For doctor, teacher, scientist and other non-tech goals, write and review SAMVED's own templates based on reliable career/education sources. Treat externally linked material as optional reading, not the source of SAMVED's personalized plan.

Suggested API: `GET /api/v1/careers`, `GET /api/v1/recommendations/me`, `GET /api/v1/roadmaps/me`, `POST /api/v1/roadmaps`, `PATCH /api/v1/milestones/{id}/status`, task CRUD, and `GET /api/v1/progress/me`. Define the DTO and allowed status values before UI wiring.

## Opportunity sourcing and workflow

Candidate sources to search and review: [Unstop](https://unstop.com/) for internships, jobs, hackathons, competitions and scholarships; [HackCulture](https://hackculture.io/) for its innovation/hackathon programs; [AICTE National Internship Portal](https://internship.aicte-india.org/) for internships in India; [Devpost](https://devpost.com/hackathons) and [Major League Hacking](https://mlh.io/) for hackathons; and [Google Summer of Code](https://summerofcode.withgoogle.com/) for its own program. These are *discovery sources*, not approved bulk data feeds. Check the organizer's official page whenever possible, because aggregator dates and eligibility can change. Add other sources only after checking relevance and rights. Google search queries such as `site:unstop.com/hackathons student India 2026`, `site:hackculture.io hackathon registration`, and `site:internship.aicte-india.org internship software` can help you find candidates; verify every result at its destination.

For each opportunity record, store: `id`, type, title, organizer, your own short summary, original listing URL, official application URL, source name, career/skill tags, education/eligibility, location or remote, fee if any, registration deadline with timezone (or explicitly unknown), status (`DRAFT`, `VERIFIED`, `EXPIRED`, `WITHDRAWN`), `checked_at`, and optional notes on rights/permission. Validate links and dates, preserve unknowns, de-duplicate by canonical URL plus organizer/title, and never show an expired item as open. A review job can flag records whose deadline passed or whose `checked_at` is stale; a person then confirms them. Start with a curated seed file or protected import command. An admin UI and automated partner feeds can wait.

Proposed read API: `GET /api/v1/opportunities?type=&career=&skill=&location=&page=&size=` with a bounded page size and only verified, non-expired results by default. UI cards show title, organizer, eligibility summary, deadline, where the date was checked, and a clear **Apply on source site** button. Do not claim an opportunity is guaranteed, endorsed, or still open without recent verification.

Google's [Custom Search JSON API](https://developers.google.com/custom-search/v1/overview) is closed to new customers and scheduled to end for existing customers on 1 January 2027. Do not design the new MVP around it. If you later obtain a licensed API or written syndication permission from a source, add a separate importer with source-specific terms, rate limits, provenance and manual review before publication.

## Run the current frontend on your computer

Open PowerShell and run:

```powershell
cd E:\GITHUB\oops\frontend
python -m http.server 8000 --bind 127.0.0.1
```

Then open **http://127.0.0.1:8000/** (or `/index.html`) in your browser. Keep the PowerShell window open while using the site; press **Ctrl+C** to stop it. Python 3.12 is installed on this machine, so this command is available. If port 8000 is occupied, use 8001 in both the command and URL. If `python` is not recognized on another machine, try `py -m http.server 8000 --bind 127.0.0.1`.

This static server only serves HTML/CSS/JS. It does not run Java or MySQL. Current login stores a plaintext demo password in browser localStorage, so use a throwaway password and no real student details. If demo state behaves strangely, clear site data for `127.0.0.1:8000` in the browser; note that `localhost:8000` has separate browser storage.

When the backend exists, serve the static files and `/api/v1` from the **same Spring Boot origin** so session cookies and CSRF are simpler. A build step can copy `frontend/` into `backend/src/main/resources/static/`; [Spring Boot's official docs](https://docs.spring.io/spring-boot/3.5/reference/web/servlet.html) identify `/static` as a default classpath location and `index.html` as the welcome page. The integrated app would then open at `http://127.0.0.1:8080/` during development. Keep the original `frontend/` as the editable source and automate the copy; avoid editing two copies by hand.

## Verification gates

1. **Contracts:** Christa and you agree DTO examples, status enums, migrations and session/CSRF flow before dependent modules merge.
2. **Each backend slice:** tests cover expected result, invalid input, unauthenticated access, another student's ownership, database reload and failure response.
3. **Content:** each roadmap template is original and reviewed; each opportunity has a working source/application link, checked date, eligibility and deadline status.
4. **Integration:** the full browser journey works against MySQL, including reload, logout, expired opportunity and unavailable API.
5. **Real-user release:** replace localStorage credentials and all fake progress/opportunities, verify privacy and account deletion, run security and accessibility checks, and record a release/rollback smoke test. Do not invite real students before this gate passes.
