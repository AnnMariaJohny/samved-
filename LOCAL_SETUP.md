# Run SAMVED locally on Windows

1. Start MySQL. Create the `samved` database and a database user with privileges on `samved.*` if they do not already exist.
2. Keep the matching `SAMVED_DB_URL`, `SAMVED_DB_USER` and `SAMVED_DB_PASSWORD` in `backend/.env` (see `backend/.env.example`). Preserve existing provider keys. Use plain `KEY=value` entries, without quotes or `export`.
3. Double-click **Start SAMVED.cmd**. It builds the current frontend/backend and opens the login page once MySQL migrations and startup succeed. Java 17 and Maven from this checkout's `.tools` directory are used.
4. Choose **Create Account**, enter a new account password and complete your profile. Old browser-only prototype accounts are not database accounts and must be registered again. The MySQL password is for the app's database connection; it is not your website login password.

Use one browser address consistently: `http://127.0.0.1:8080`. `localhost` and `127.0.0.1` have separate browser cookies. The frontend and backend share port 8080; MySQL uses 3306. No separate static server is needed.

Complete the **Career profile** checklist before accessing the dashboard or other features. Profile pages guide users through all required sections and the eight-question assessment. After completion, **Recommended for you** shows personal suggestions and **Explore any roadmap** searches the entire available catalogue. Click **Add to my roadmaps** to save a path; **My saved roadmaps** lets you open, activate or remove it. Manual choices remain saved even when interests or recommendations change.

The app now supports registration, login/logout, saved personal details, academic records and subjects, skills, interests, strengths, values, selected/custom/exploring goals, assessments, guidance, roadmaps, tasks, progress, reminders and analytics from saved records. Profile includes password change and account deletion. Password changes invalidate other sessions; a Java restart requires signing in again, while MySQL data remains saved.

AI recommendations and generated role roadmaps need `SAMVED_NVIDIA_API_KEY`. An uncached external roadmap catalogue needs `PARSE_API_KEY`. Without those keys, core account/assessment/task/roadmap features work; AI uses its existing rule fallback and external discovery can report unavailable. Opportunities appear only when real listings are imported or configured feeds supply them. No fake listings or chart data are added.

Roadmap.sh graphs and topic explanations now open inside SAMVED on the dashboard, Career Roadmap and catalogue viewer. Use Map/Topics, search, zoom and clickable nodes. Successful graph/topic/guide fetches are cached locally in `backend/.roadmap-cache` (ignored by Git); uncached content needs the Parse key. Optional third-party lessons remain external links. These snapshots are for personal local use; source-owner permission is required before public redistribution.

The launcher saves its process ID in `.tools/samved-local.pid` and logs in `.tools/samved-local.log` / `.tools/samved-local-errors.log`. To stop it, end that process in Task Manager. If you started it with Maven in a terminal, use Ctrl+C. After code or page edits, stop and launch again to rebuild.

The local pilot registration is for adults and displays its privacy notice. Password reset by email, email/SMS notifications and public deployment are outside this local integration.
