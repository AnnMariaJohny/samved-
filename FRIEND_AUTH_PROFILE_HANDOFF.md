> **15 October 2026:** Account/profile integration is now implemented in this checkout at the user’s request. The assignment below is historical. Current behavior and the compact JSON section schema are documented in backend/README.md and LOCAL_SETUP.md.

# Christa's SAMVED work: login and student profile

**For:** Christa  
**Owner:** Christa owns the work described here end to end.  
**Project:** SAMVED, Java/Spring Boot REST API, MySQL, Spring Data JPA, Maven.  
**Status:** Assignment from Developer A. This file supplies the working decisions and steps. Developer A's backend foundation now exists; Christa's auth/profile API examples describe what she still needs to build.

**Update, 13 October 2026:** Developer A has now created `backend/` with Java 17, Spring Boot 3.5, Maven, a Java Flyway V1 migration, common error responses, and the guidance modules. Do **not** create another app. Read `backend/README.md` before starting. Backend application and migration source must be Java only; write your Flyway migration as a Java class (V2 or later) instead of a `.sql` file. The static frontend is packaged into Spring Boot by Maven. Developer A's tests pass against H2; MySQL integration is still unverified on this computer.

**Exact shared contract:** On successful login, put the persisted student **profile ID** as a `Long` in the server session attribute `samvedStudentId` and establish Spring Security authentication. Implement `io.samved.common.StudentProfilePort.snapshot(long studentId)` from your stored profile using the `StudentSnapshot` record. Replace Developer A's temporary `config/WebSecurity.java` with your session/CSRF setup. For account deletion, call `DeveloperADataDeletion.deleteForStudent(profileId)` in the same transaction before deleting the profile/account. The existing `PendingStudentProfilePort` deliberately returns 503 until your implementation exists. Coordinate any changed DTOs before wiring your frontend forms.

Developer A's career pages now call the shared `frontend/api/developer-a-api.js`, which expects `GET /api/v1/auth/csrf -> {token}` and adds `X-CSRF-TOKEN` on writes. After login or session rotation, call `window.SamvedApi.clearCsrf()` so the next write fetches a fresh token. Use `backend/API_CONTRACT.md` for the implemented Developer A routes and exact DTO fields. Keep your `frontend/api/api.js` work compatible with this helper instead of adding a second conflicting login state.

## Start here — your job in simple words

Christa, you are building the part of SAMVED that remembers **who a student is** and **what the student has told us about themselves**. A student should be able to create an account, log in, fill in their profile, leave the site, return later, and see the same information. Nobody else should see or change that student's private information.

You will build the Java code, MySQL tables, API endpoints, automated tests, and the connection from the existing HTML/JavaScript pages. The current pages only save data in the browser. Your work replaces that temporary behavior with real server data.

**A useful picture of success:** Create two test accounts, Asha and Ravi. Asha saves her education, interests and skills. After refresh and a new login, Asha still sees her data. Ravi sees only Ravi's data. Their passwords cannot be read from the database or browser storage.

Developer A is the project lead and owns the starter Spring Boot app, shared conventions, assessment, recommendations, roadmap, tasks, progress, opportunities and final integration. You own login/security and the profile pages. When your endpoints are ready, give Developer A the exact request/response examples so the other modules can use the profile safely.

You do **not** need to wait for a deadline or weekly-hours answer. Work through the checkpoints below. The stack for this assignment is Java + Spring Boot + Maven + Spring Data JPA + MySQL. If a course rule later requires JDBC, Developer A will handle that project-wide change; do not start with a second implementation.

### What to do first, and what to avoid

**Do:** Read the existing login/profile screens, write down their fields, then build one feature at a time: account creation, login, profile save, academics, selections, and finally the browser connection. Show a working test after each step. Save data in MySQL and always obtain the student identity from the server session.

**Do not:** Copy the current browser-only login logic into the backend, keep passwords in browser storage, trust a student ID supplied by the page, claim a save worked before MySQL confirms it, or add unrelated AI/recommendation code. Do not edit Developer A's feature modules to work around a contract mismatch; send the mismatch to Developer A with an example request and response.

## 1. What you are building

Build two P0 capabilities:

1. **Authentication and private student data.** A student registers, signs in, stays signed in through a server-managed session, reads their own account, changes their password while signed in, deletes their own account, and signs out. Passwords are stored only as adaptive one-way hashes. A student must never be able to read or change another student's records.
2. **Student profile and background.** The signed-in student saves and reloads their name, education level, optional city/region, academic records, interests, skills with proficiency, strengths, values, and career goal. Every field is validated on the server and persisted in MySQL.

This is a substantial, meaningful backend slice. You own model → migration → repository → service → controller → validation → tests → frontend integration for these features. Developer A owns the common Spring Boot scaffold, assessment, career guidance, roadmap/tasks/progress/opportunities, overall API contract file, and release integration. The previous `SAMVED_BACKEND_PLAN.md` has the *old* ownership split; this file is your assignment.

**Workload note:** These two capabilities are Christa's meaningful share of the backend. Developer A takes the remaining feature modules and release integration. Authentication needs careful testing, so count tests and frontend wiring as part of this assignment, not as extra work.

## 2. Starting evidence and source files

The merged frontend is in `frontend/`. No Java backend, database schema, or API implementation was present at the time this handoff was written. Current browser behavior is a prototype:

| Frontend source | What it currently does | Required backend replacement |
| --- | --- | --- |
| `frontend/auth/register.html` and `register.js` | Collect name, email, password, age, location and education; save a **plaintext password** in `localStorage` | Call registration API; never persist password in browser storage |
| `frontend/auth/login.html` and `login.js` | Compare entered password with `localStorage` | Call server login; use server session; show safe error messages |
| `frontend/profile/profile.html` and `profile.js` | Edit name, age, location, education and read browser-local values | Read/update `/students/me`, render loading/error/success states |
| `frontend/profile/academic.html` | Save academic records in browser storage | Persist student-owned academic records via API |
| `frontend/profile/interests.html`, `skills.html`, `strengths.html`, `values.html`, `careergoal.html` | Save selections and goal in browser storage | Persist each group via student-owned API |
| `frontend/profile.js` at the root | Gives the career pages a demo profile bridge | Later read an authenticated profile DTO; coordinate changes with Developer A |

Some profile pages contain JavaScript inside their HTML and also have same-name `.js` files. Check which code actually loads before editing; do not attach both implementations and create duplicate save handlers. Keep the existing HTML/CSS/JavaScript stack.

## 3. Decisions Developer A has made for this assignment

Use these decisions now. They are **project choices for the MVP**, not claims that code already exists.

| Topic | Decision and what Christa should do |
| --- | --- |
| Schedule | No calendar deadline or weekly-hour target is assumed. Complete the checkpoints in Section 10 in order and show evidence at each. |
| Stack | Java, Spring Boot, Maven wrapper, Spring Data JPA, MySQL and Flyway migrations. Developer A chooses compatible dependency versions in the starter app; use that app. |
| Hosting | Serve the static frontend and REST API from the **same Spring Boot origin**. Locally use `http://localhost:8080`; deployment uses one HTTPS origin chosen later. The production domain name is not needed to implement this. Do not add cross-origin CORS for the MVP. |
| Login | Use a server-managed session cookie. Set `HttpOnly`, `SameSite=Lax`, and `Secure` under HTTPS. Keep CSRF protection on. Add `GET /api/v1/auth/csrf` to provide a token to the JavaScript client; send it in `X-CSRF-TOKEN` on requests that change data. The browser sends the session cookie automatically. |
| IDs and errors | Use generated long IDs internally; expose IDs only where needed. One `users` row has one `student_profiles` row. Use `{code,message,fieldErrors,requestId}` for errors and UTC timestamps. Developer A provides the shared exception/error class and migration numbering; use them. |
| Pilot audience | First real-user pilot is **18+ students only**. Remove the current age field. Registration asks students to confirm they are at least 18 and accept the displayed privacy notice; store the confirmation time and notice version. Do not collect birth date. Developer A owns the privacy notice text and recruiting rules. |
| Location | Keep only optional city/region text, maximum 100 characters. Do not ask for a street address or GPS location. |
| Education | Accept exactly `school`, `higher-secondary`, `undergraduate`, `postgraduate`, `other`. Store the selected value; `other` stays `other`. |
| Career goal | Store `SELECTED` plus a known career, `CUSTOM` plus a bounded custom career name, or `EXPLORING` with no career name. “I'm not sure yet” means `EXPLORING`; it must not be rewritten as Scientist or another career. |
| List saves | `PUT` of academics/interests/skills/strengths/values replaces the current student's complete list in one transaction. Sending the same request twice yields the same result and no duplicate rows. Empty list clears a section. |
| Academic scores | Use an explicit score type and numeric value: `PERCENTAGE` from 0 to 100 with up to two decimal places, or `CGPA_10` from 0 to 10 with up to two decimal places. No free-text `"8.6 CGPA or 86%"` is stored. Subject marks are percentage values from 0 to 100. The UI must ask which overall score type applies. |
| Skill proficiency | Accept exactly `BEGINNER`, `INTERMEDIATE`, `ADVANCED`; map the current form labels to these values. |
| Account extras | Email change, self-service forgotten-password reset and admin accounts are **outside this MVP assignment**. Signed-in password change and signed-in account deletion are **inside** it. Do not add an admin role or reset-by-email flow. |

Developer A will land the runnable `backend/` skeleton, Maven wrapper and common error conventions first. You can map form fields and draft DTOs/tests while that happens. Do not create a second Maven app or separate database. Shared contract edits go through Developer A's review; this is coordination, not a list of questions Christa must answer.

## 4. Ownership boundaries and deliverables

| Area | Your ownership | Coordinate with Developer A |
| --- | --- | --- |
| Backend packages | `auth/`, `security/`, `student/` and their tests under `backend/src/` | Shared `config/`, `common/`, `pom.xml` and error response format |
| MySQL migrations | `users`, `student_profiles`, academics and selection tables in agreed Flyway migration numbers | Migration sequence, foreign-key IDs, test database setup |
| Frontend | `frontend/auth/`, `frontend/profile/`, and auth/profile calls in `frontend/api/api.js` | Root `frontend/profile.js`, dashboard and assessment consumers |
| Contracts | Draft request/response JSON and auth/session behavior | Developer A is steward of the single versioned API spec; both review changes |
| Tests | Unit, controller/security, repository and MySQL-backed integration tests for owned features | Shared CI test command and fixtures |

For account deletion, implement deletion of `users` and **your** profile-related tables. Developer A will wire deletion of assessment, roadmap, task and other modules into the final account-deletion transaction before real-user release. Do not directly edit those modules to make deletion work.

Do not edit Developer A's recommendation, roadmap, task, progress, opportunity or assessment packages without agreeing on a cross-module change. Give Developer A a stable authenticated-student lookup interface instead of letting every module read auth tables directly.

## 5. MySQL tables to build

Create the smallest schema that supports the actual screens. Use Flyway migrations, foreign keys, unique constraints and indexes. Follow the field types and enum choices in Section 3; put the final column names and DTO examples in the shared API spec for Developer A's review.

| Table | Purpose and constraints |
| --- | --- |
| `users` | Generated ID; normalized email with unique index; `password_hash`; `STUDENT` role; adult-confirmation time, privacy-notice version/acceptance time, created/updated timestamps. Never store plaintext or reversible password. |
| `student_profiles` | One-to-one `user_id` unique FK; name; education level; optional city/region; career goal type/text; timestamps. Do not add an age or birth-date column. |
| `academic_records`, `academic_subjects` | Record ID, student-profile FK, level, institution, course, `CLASS` or `SEMESTER`, period number, score type/value, and child subjects with names and percentage marks. Multiple academic records are allowed; reject exact duplicates for the same student, institution, course and period. |
| `student_interests`, `student_strengths`, `student_values` | Student FK plus bounded catalogue key or normalized label. Prevent duplicate selections per student. |
| `student_skills` | Student FK, skill key/label, proficiency enum; prevent duplicate skill rows per student. |

Catalogues may be separate tables if the same choices are reused and curated. Keep free-text input bounded and validated. Do not create a table for a field that can be kept safely on `student_profiles`. `DELETE /students/me` removes the user's account and all currently owned private rows and invalidates their session. Developer A expands this across future modules before release. Define foreign-key cascades deliberately; do not leave orphan rows. In production, validate schema against migrations; avoid relying on Hibernate to auto-create or silently update tables.

## 6. REST endpoints to build

All paths are under `/api/v1`. Request/response bodies are JSON. Authenticated routes use the server's current session identity; they never accept a student ID to decide ownership. Define an error body such as `{ "code": "VALIDATION_ERROR", "message": "...", "fieldErrors": {"name":"..."}, "requestId": "..." }` in the shared spec. Use predictable status codes and no stack traces in API responses.

| Method and path | Input | Success | Important failures |
| --- | --- | --- | --- |
| `GET /auth/csrf` | No session required | `200` CSRF token for the next unsafe request | Server unavailable |
| `POST /auth/register` | Email, password, name, education level, optional city/region, adult confirmation and privacy acceptance | `201` with safe user/profile summary; no hash | `400` invalid fields/consent, `409` duplicate email |
| `POST /auth/login` | Email, password | `200` safe session/user summary and session cookie | `401` generic invalid credentials; throttling after repeated failures |
| `GET /auth/me` | Session cookie | `200` current user/profile summary | `401` no/expired session |
| `POST /auth/logout` | Session cookie and CSRF token | `204`, session invalidated; repeat logout also `204` | `403` missing/invalid CSRF token |
| `PUT /auth/password` | Current password, new password, CSRF token | `204`, current session kept or renewed | `400` weak new password, `401` wrong current password |
| `GET /students/me` | Session cookie | `200` current student's profile | `401` unauthenticated |
| `PUT /students/me` | Name, optional city/region, education level, goal type/text | `200` updated profile | `400` invalid fields, `401` unauthenticated |
| `DELETE /students/me` | Session cookie and CSRF token | `204`, account and private data deleted; session invalidated | `401` unauthenticated, `403` invalid CSRF token |
| `GET/PUT /students/me/academics` | Array of academic records | `200` persisted records | `400` invalid scores/duplicates |
| `GET/PUT /students/me/interests` | Bounded selection array | `200` persisted selections | `400` invalid/duplicate values |
| `GET/PUT /students/me/skills` | Skill + proficiency array | `200` persisted skills | `400` unknown proficiency/duplicates |
| `GET/PUT /students/me/strengths` | Bounded selection array | `200` persisted selections | `400` invalid/duplicate values |
| `GET/PUT /students/me/values` | Bounded selection array | `200` persisted selections | `400` invalid/duplicate values |

Do not add `/students/{id}` CRUD merely because the table has IDs. If a future internal endpoint uses an ID, enforce owner checks in the service or query itself and return `404` for a record the current student does not own. A client-supplied `userId` or `studentId` in a body must be rejected, never trusted.

### Example registration request (working contract)

```json
{
  "email": "asha@example.test",
  "password": "ExampleOnly1!",
  "name": "Asha Test",
  "educationLevel": "undergraduate",
  "cityRegion": "Kochi",
  "adultConfirmed": true,
  "privacyAccepted": true
}
```

The server supplies the current privacy-notice version and stores it with the acceptance time. The response contains a safe user/profile summary, never the password or hash. The example password is disposable test data, not a real credential.

### Example profile response

```json
{
  "id": 42,
  "name": "Asha Student",
  "educationLevel": "undergraduate",
  "careerGoal": { "type": "SELECTED", "text": "Software Engineer" },
  "interests": ["technology", "design"],
  "skills": [{ "name": "Java", "proficiency": "BEGINNER" }],
  "strengths": ["problem-solving"],
  "values": ["continuous-learning"]
}
```

The real request/response schema must specify nullable fields, maximum lengths, score ranges, catalogue keys, goal types, and replacement semantics. Do not copy this example into code as an undocumented assumption.

## 7. Authentication and privacy requirements

- Use Spring Security and its `PasswordEncoder` abstraction with a supported adaptive encoder. Encode before saving, verify via `matches`, and never return or log the stored hash. Spring's [password storage reference](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html) documents this approach.
- Use a server-managed session cookie with `HttpOnly` and `SameSite=Lax`; enable `Secure` in HTTPS deployment. Rotate the session on login and invalidate it on logout. Do not put passwords, session IDs or long-lived bearer tokens in `localStorage` or `sessionStorage`.
- Keep CSRF protection for every request that changes data, including registration and login. The frontend first calls `GET /api/v1/auth/csrf`, then sends `X-CSRF-TOKEN` on those requests. Fetch a fresh token after login/session renewal; keep the token in page memory rather than browser storage. Spring's [CSRF reference](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html) describes this protection. Do not disable CSRF merely to make `fetch()` calls pass.
- The frontend and API share one origin, so do not enable broad cross-origin CORS. If development tooling later uses a second origin, Developer A handles that deployment change.
- Normalize email consistently before uniqueness checks. Return a safe, generic login failure; do not reveal whether an email exists through login messages. Apply practical throttling/rate limiting to repeated attempts.
- Validate all inputs on the server. Browser `required`, `min`, and regex checks improve UX but are not protection. Constrain strings, arrays, score ranges and accepted enum values. Use JPA repository parameters rather than SQL string concatenation.
- Resolve the current student from the authenticated security context. Every query for private data should include that owner scope. Test with two distinct accounts.
- Keep database credentials, session secrets and deployment origins in environment configuration; commit an example config without real secrets. Never log passwords, cookies, CSRF tokens, personal data dumps, or full exception traces to users.
- Remove the current age field. Require an 18+ confirmation and privacy-notice acceptance for the pilot, save when and which notice was accepted, and implement signed-in account deletion. Do not recruit minors for the first pilot. Developer A supplies the privacy-notice text before real-user testing.

## 8. Frontend integration steps

1. Create one small `api.js` client with same-origin relative URLs, JSON/error handling, `credentials: 'include'` for session requests, and `X-CSRF-TOKEN` on unsafe methods. Do not duplicate `fetch` wrappers in each page.
2. Remove age inputs from registration and profile pages. Add the 18+ confirmation and privacy-notice acceptance to registration. Replace registration's `localStorage.setItem('registeredPassword', ...)` and login's browser comparison with API calls. Remove those old keys and any code that treats `loggedIn` as proof of authentication. `GET /auth/me` decides signed-in state.
3. Load the profile from `GET /students/me` after login; show loading, validation and server-error states. `PUT /students/me` saves and then renders the server response. Do not claim save success before the server confirms it.
4. Replace the browser-only save/load of academic, interest, skill, strength, value and goal pages one by one. Change the academic score input into a score-type selector plus numeric value; map skill levels to the three enums. Add a true “I'm not sure yet” career option that sends `EXPLORING` without requiring custom text. Keep keyboard labels and validation messages accessible. Do not attach duplicate inline/external handlers.
5. Coordinate with Developer A before changing the root `frontend/profile.js` bridge and career pages. They currently read local browser keys. Keep a temporary adapter only if it is clearly demo-only; remove the adapter when the real profile API is wired.
6. Test refresh, new tab, logout, expired session, validation errors and server-unavailable behavior. No silent fallback to fake profile data after an API failure.

## 9. Test plan and definition of done

Use JUnit/Spring Boot tests and a MySQL-backed integration environment for migration and persistence checks. Unit tests alone do not prove auth or ownership. Add API tests for:

| Scenario | Expected evidence |
| --- | --- |
| Register valid student | `201`; user and profile persisted transactionally; DB password differs from input and is encoded; response has no hash |
| Duplicate/invalid registration | `409` duplicate email; field errors for invalid email, password and profile fields; no partial rows |
| Login/logout | Correct password succeeds; wrong password returns safe `401`; logout invalidates session; subsequent `/auth/me` is `401` |
| CSRF/session | Missing token blocks register/login/profile writes; valid token and session work; cookie has expected production attributes |
| Password change | Wrong current password fails; correct current password changes the hash; old password no longer logs in |
| Unauthenticated profile request | `401` for every private route |
| Two-student isolation | Student B cannot read/update/delete A's profile, academics or selections, even with guessed IDs/body owner IDs |
| Persistence | Save profile and each collection, restart/reconnect or use a fresh session, then read identical persisted data |
| PUT semantics | Repeating the same request does not create duplicates; replacing/deleting selections behaves as documented |
| Input edge cases | Empty name, overlong text, invalid education/proficiency, duplicate selections and out-of-range scores return field errors; `EXPLORING` saves with no career text and returns unchanged |
| Pilot eligibility | Missing adult confirmation or privacy acceptance blocks registration; no age/birth-date value is stored |
| Account deletion | Signed-in delete removes private rows and invalidates session; a second account remains intact |
| Browser integration | Register → login → edit profile → save academics/selections/goal → reload → logout works against Java + MySQL; error states are visible |

**Done means:** migrations apply to a clean MySQL database; `mvn test` passes; security and wrong-owner tests pass; browser flow uses real API data; API examples and setup instructions are current; Developer A reviews the PR. Provide test command output or CI links in the PR. Do not call the feature complete merely because the forms render or local storage appears to work.

## 10. Recommended work order and handoff points

1. Read the current frontend forms and list each field, local-storage key and validation rule. Compare with the DTOs described in this handoff.
2. Copy Section 3's decisions into the shared API spec, add sample JSON and error examples, and give Developer A the spec for review. This is a review checkpoint, not a request for new design choices.
3. Build migrations and repository entities; verify unique email, one-to-one profile and student ownership constraints.
4. Implement register/login/logout/me and security tests first. Replace browser-stored password flow before using real student credentials.
5. Implement profile and academics, then interest/skill/strength/value/goal collections with validation and persistence tests.
6. Wire the frontend pages to the APIs incrementally, demonstrating a full refresh-safe flow to Developer A after each group.
7. Review Developer A's `StudentSnapshot` consumer needs, lock the interface, and hand over example fixtures for assessment and recommendation work.
8. Run the final two-account isolation and browser smoke checks; document any observed defect with its reproduction steps and fix.

## 11. What to send Developer A at each checkpoint

Christa does not need to design the rest of SAMVED. She should send these concrete handoffs to Developer A:

1. **Contract checkpoint:** the finalized JSON examples, education/goal/score/proficiency enums, error responses, and session/CSRF flow.
2. **Authentication checkpoint:** migration files, register/login/logout/me/password-change tests, and proof that no plaintext password is stored or returned.
3. **Profile checkpoint:** API examples for profile, academics and each selection list; MySQL persistence test results; a `StudentSnapshot` example without private auth fields.
4. **Frontend checkpoint:** a short screen recording or browser-test result showing register → login → edit profile → refresh → logout, plus two-account isolation results.

If a course rule or deployment environment later changes, Developer A will update the shared contract and tell Christa exactly which part of her slice changes. Christa can start the field mapping and DTO work using this document now.
