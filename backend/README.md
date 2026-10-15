# SAMVED Java backend

Java 17 / Spring Boot / Maven / MySQL. The same app serves frontend files and /api/v1 endpoints. See ../LOCAL_SETUP.md and launch ../Start SAMVED.cmd on this workstation.

## Accounts and profiles

Dashboard and Career Roadmap now share personalized suggestions and all-catalogue browsing. The V5 migration stores explicit survey-review markers and up to 20 saved source-roadmap slugs with an active choice. GET `/api/v1/students/me/onboarding` supplies the eight-section checklist; PUT `/students/me/review/{section}` records an explicit career-direction choice (other sections require saved data). All eight assessment questions must still be answered. GET `/roadmaps/guidance` supplies transparent interest/skill/goal/assessment matches after checklist completion. POST `/roadmaps/preferences`, PUT `/roadmaps/preferences/active` and DELETE `/roadmaps/preferences/{slug}` manage the authenticated student's manual choices. All paths use `/api/v1`. All features, including catalogue browsing, require completion of the eight-section checklist. Direct feature pages redirect to the first unfinished section; feature APIs return 403 with code ONBOARDING_REQUIRED and nextPath. Profile, assessment, account settings and sign-out remain accessible. Clearing required data locks features again. Changed recommendations do not replace saved choices. See `../QA_EVIDENCE/PERSONAL_ROADMAPS.md`.

Registration and login are implemented. Use a new website account; old browser-only prototype accounts are not imported. Passwords use BCrypt. Spring Security sessions are persisted explicitly, rotated on login and password change, and invalidated on logout. CSRF protects every write including registration and login. Password change revokes other account sessions. Account deletion removes assessments, notifications, tasks and roadmaps before the profile and user, and invalidates other sessions on their next request.

auth/ implements accounts, throttling (20 credential/registration attempts per IP per minute in this process), sessions, password change and deletion. student/ProfileService implements StudentProfilePort, so guidance now reads the persisted account profile. The session attribute samvedStudentId contains the profile ID; request bodies cannot choose the owner.

GET /api/v1/auth/csrf returns {token}. POST /auth/register creates an account (201), POST /auth/login starts a session (200), GET /auth/me returns the current profile, POST /auth/logout ends it (204), PUT /auth/password takes currentPassword and newPassword (204). All paths have the /api/v1 prefix.

GET/PUT /api/v1/students/me read/update name, educationLevel, cityRegion and careerGoal {type,text}. GET/PUT subroutes academics, interests, skills, strengths and values replace a complete section. DELETE /students/me permanently removes the account and its private journey.

Education: school, higher-secondary, undergraduate, postgraduate, other. Goal types: SELECTED, CUSTOM, EXPLORING (text null). Skill proficiency: BEGINNER, INTERMEDIATE, ADVANCED. Academic records contain educationLevel, institution, course, periodType (CLASS/SEMESTER), period (1–20), scoreType (CGPA_10/PERCENTAGE), score and subjects [{name,marks}]. Subject marks are percentages. Maximums: 10 academic records with 20 subjects each, 50 skills, 30 selections per list, 60 KB per encoded section. Nested inputs, score scales and duplicates are validated. Unknown request fields are rejected.

The Java Flyway V4 migration adds users and student_profiles. To keep the small local integration atomic, bounded, validated profile sections are JSON documents in TEXT columns on the profile rather than separate collection tables. @Version detects simultaneous edits. JPA validates the migrated schema. V1–V3 and the existing guidance tables remain intact.

## Configuration

Run from backend/ so the optional .env properties import is found. Use plain KEY=value entries. Keep real secrets out of Git; .env.example lists the local options.

- SAMVED_DB_URL: jdbc:mysql://127.0.0.1:3306/samved
- SAMVED_DB_USER and SAMVED_DB_PASSWORD: matching local MySQL credentials
- SAMVED_PORT: 8080 by default
- SAMVED_SECURE_COOKIE: false for local HTTP; true for HTTPS deployments
- SAMVED_NVIDIA_API_KEY: optional NVIDIA NIM guidance/generated roadmap key; default model openai/gpt-oss-20b, override with SAMVED_NVIDIA_MODEL only with compatible JSON output
- PARSE_API_KEY: needed for the first roadmap.sh catalogue fetch; validated summaries are then cached in MySQL
- SAMVED_UNSTOP_ENABLED: enables the existing six-hourly opportunity import; approved feeds are documented in OPPORTUNITY_FEEDS.md
- SAMVED_OPPORTUNITY_IMPORT: optional reviewed JSON import path
- SAMVED_OPPORTUNITY_FEED_URLS: authorized feed URLs
- SAMVED_REMINDER_ZONE: Asia/Kolkata; SAMVED_REMINDER_POLL_MS: hourly by default

Core account, profile, assessment, task and starter-roadmap features work without provider keys. AI ranking falls back to rules. Empty external catalogues or AI-generated roadmaps can return 503 without their provider. No fake active opportunities are seeded. In-app reminders are implemented; email/SMS/push are not.

## Verification

Run mvn verify with Java 17. AccountIntegrationTest uses real CSRF tokens and server sessions against Flyway-migrated H2 tables. It covers password hashing, duplicate/invalid registration, login/session rotation, logout, profile persistence, account isolation, nested validation, password changes and account deletion. Existing module tests remain in the suite. Three external-provider live tests remain opt-in.

Browser evidence and the final MySQL check are recorded in ../QA_EVIDENCE/ACCOUNT_INTEGRATION.md. The local privacy notice is frontend/auth/privacy.html. Public deployment still needs an operator-specific privacy notice and deployment review.

Spring references: [session persistence](https://docs.spring.io/spring-security/reference/servlet/authentication/persistence.html), [CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html).
