# SAMVED

A career guidance portal with a Java 17 / Spring Boot backend, MySQL persistence and a same-origin HTML/CSS/JavaScript frontend.

## Run the frontend, backend, and MySQL locally on Windows

SAMVED has **one web server**. Its only active frontend source is `SAMVED_Portal_Updated/JAVA PROJECT OOP/`. Maven packages that directory into the Spring Boot backend. The old `frontend/` directory is unused by the build. The backend serves the pages and `/api/v1` on port `8080`; MySQL stores account and app data on port `3306`.

### 1. Check Java and Maven

Install JDK 17 and MySQL Server. Maven 3.9+ is required; this checkout already has Maven 3.10.0 at `.tools/apache-maven-3.10.0`. In PowerShell, run these commands from the repository root:

```powershell
& "$env:JAVA_HOME\bin\java.exe" -version
& "$env:JAVA_HOME\bin\javac.exe" -version
& ".\.tools\apache-maven-3.10.0\bin\mvn.cmd" -version
```

The Java commands should report version 17. You do not need to lengthen the Windows `Path` variable: the launcher and commands here use `JAVA_HOME` and the Maven executable directly. If the Maven file is missing in a fresh clone, extract the Maven 3.10.0 binary archive so that `.tools/apache-maven-3.10.0/bin/mvn.cmd` exists, or use any installed Maven 3.9+ executable instead.

### 2. Configure MySQL once

Install MySQL Server if needed. In MySQL Workbench's SQL editor, connected as an administrator, run the following **only if the database and app user do not already exist**. Replace the sample password with your own:

```sql
CREATE DATABASE IF NOT EXISTS samved CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'samved'@'127.0.0.1' IDENTIFIED BY 'choose-a-strong-local-password';
GRANT ALL PRIVILEGES ON samved.* TO 'samved'@'127.0.0.1';
```

Copy `backend/.env.example` to `backend/.env` if `.env` does not exist. Set these values to match your MySQL database and user:

```properties
SAMVED_DB_URL=jdbc:mysql://127.0.0.1:3306/samved
SAMVED_DB_USER=samved
SAMVED_DB_PASSWORD=choose-a-strong-local-password
SAMVED_SECURE_COOKIE=false
```

Keep any existing optional API keys in `.env`. Use plain `KEY=value` lines without quotes. `.env` is ignored by Git; never commit database passwords or API keys. The database password connects the app to MySQL; your website account gets a separate password when you register. Flyway creates and updates the app's tables at startup.

### 3. Start the website

**Double-click:** open `Start SAMVED.cmd` in the repository root. It starts the local MySQL Windows service if needed, builds the current frontend and backend, starts Java, checks startup, and opens the login page. Windows may show an administrator prompt if MySQL was stopped. The first build may download Maven dependencies and take a few minutes.

**One terminal command:** from PowerShell in the repository root, run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1
```

This runs the same launcher as the double-click file. The app continues running after the command returns. If more than one MySQL or MariaDB Windows service exists, set `SAMVED_MYSQL_SERVICE` to the correct service name before launching. To build and run Java manually instead, use:

```powershell
$repo = (Get-Location).Path
& ".\.tools\apache-maven-3.10.0\bin\mvn.cmd" -f backend/pom.xml "-Dmaven.repo.local=$repo/.tools/m2" -DskipTests clean package
Set-Location backend
& "$env:JAVA_HOME\bin\java.exe" -jar target/samved-backend-0.1.0-SNAPSHOT.jar
```

If you use a different Maven installation, replace the `mvn.cmd` path. The manual commands assume MySQL is already running. Run the jar from `backend/` so it reads `backend/.env`. Press Ctrl+C to stop a manual run.

Open <http://127.0.0.1:8080/login.html>. Use `127.0.0.1` consistently because it and `localhost` have separate browser cookies. Create a website account, then complete the required profile sections and career assessment. MySQL keeps your account and progress after a Java restart. Edit pages in `SAMVED_Portal_Updated/JAVA PROJECT OOP/`, then stop the app and rebuild/restart it. Clean builds remove retired static files from the previous frontend.

The launcher writes its process ID to `.tools/samved-local.pid` and logs to `.tools/samved-local.log` and `.tools/samved-local-errors.log`. To stop a launcher run, end that Java process in Task Manager. If startup fails, check those logs, confirm the `.env` credentials match, and make sure port `8080` is free. See [LOCAL_SETUP.md](LOCAL_SETUP.md) for more local setup details.

## Features

New accounts follow [the guided onboarding flow](ONBOARDING_FLOW.md) before the dashboard unlocks. Every required section must be saved. A separate, labelled judge-demo account is available through the demo shortcut. After assessment, career suggestions, roadmap matches and opportunities load automatically.

- Account registration, login/logout, password changes and account deletion.
- Mandatory profile details, academic records, interests, skills, strengths, values, career direction and assessment.
- Personalized roadmap suggestions, catalogue search and saved roadmap choices.
- Roadmaps and topic explanations displayed inside SAMVED.
- Tasks, progress, deadlines, reminders, opportunities and analytics.

Optional external catalogue/content retrieval needs `PARSE_API_KEY`; optional AI features need `SAMVED_NVIDIA_API_KEY`. Configure them only in `backend/.env`. Provider content caches, account data, credentials and generated builds are not included in this repository. Roadmap source snapshots remain subject to the source owner's terms; see [local setup](LOCAL_SETUP.md).

## Source and verification

- `SAMVED_Portal_Updated/JAVA PROJECT OOP/`: the active website, its own HTML/CSS, and `portal-app.js` API integration.
- [Updated portal page map](SAMVED_Portal_Updated/README.md): source pages, old URL aliases, and matching APIs.
- `backend/`: application, migrations and tests.
- `QA_EVIDENCE/`: local verification reports and screenshots.
- [Backend instructions](backend/README.md) and [API contract](backend/API_CONTRACT.md).
- [Mandatory onboarding verification](QA_EVIDENCE/MANDATORY_ONBOARDING.md).

Run the automated tests from the repository root:

```sh
mvn -f backend/pom.xml verify
```
