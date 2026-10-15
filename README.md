# SAMVED

A career guidance portal with a Java 17 / Spring Boot backend, MySQL persistence and a same-origin HTML/CSS/JavaScript frontend.

## Run locally

Install Java 17, Maven 3.9+ and MySQL. Create the `samved` database, then copy `backend/.env.example` to `backend/.env` and enter your local database credentials. Do not commit that file.

From a terminal, start the app from the backend directory so it can read `.env`:

```sh
cd backend
mvn spring-boot:run
```

Open <http://127.0.0.1:8080/auth/login.html>. The backend serves the frontend on the same port. Register an account and complete all required profile sections and the career assessment to unlock the website. MySQL migrations run automatically; existing accounts and saved progress persist between restarts.

`Start SAMVED.cmd` is an alternative for the original Windows checkout with its local Java and Maven installations in `.tools`. Those machine-specific tools are excluded from Git; a fresh clone can use the Maven command above.

## Features

- Account registration, login/logout, password changes and account deletion.
- Mandatory profile details, academic records, interests, skills, strengths, values, career direction and assessment.
- Personalized roadmap suggestions, catalogue search and saved roadmap choices.
- Roadmaps and topic explanations displayed inside SAMVED.
- Tasks, progress, deadlines, reminders, opportunities and analytics.

Optional external catalogue/content retrieval needs `PARSE_API_KEY`; optional AI features need `SAMVED_NVIDIA_API_KEY`. Configure them only in `backend/.env`. Provider content caches, account data, credentials and generated builds are not included in this repository. Roadmap source snapshots remain subject to the source owner's terms; see [local setup](LOCAL_SETUP.md).

## Source and verification

- `frontend/`: the current integrated website; replaces the original frontend files formerly at the repository root.
- `backend/`: application, migrations and tests.
- `QA_EVIDENCE/`: local verification reports and screenshots.
- [Backend instructions](backend/README.md) and [API contract](backend/API_CONTRACT.md).
- [Mandatory onboarding verification](QA_EVIDENCE/MANDATORY_ONBOARDING.md).

Run the automated tests from the repository root:

```sh
mvn -f backend/pom.xml verify
```
