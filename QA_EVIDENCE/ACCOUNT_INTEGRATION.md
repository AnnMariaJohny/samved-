# Account/profile integration verification — 15 October 2026

## Implemented

Database accounts, BCrypt password hashing, server sessions, CSRF-protected registration/login/writes, logout, signed-in password change, account deletion, profile section persistence and StudentProfilePort integration. Private pages load server identity. Analytics now uses saved records. Local launcher and setup instructions are included.

## Automated verification

`mvn verify`: 50 tests, 0 failures, 0 errors, 3 optional provider live tests skipped (47 passed). Output: `.tools/auth-final-verify.log`; detailed XML reports: `backend/target/surefire-reports/`.

The account integration suite uses real CSRF tokens/session persistence and Flyway migrations against H2 in MySQL compatibility mode. It checks hashed passwords, duplicate and invalid registrations, login/logout/session rotation, missing CSRF rejection, nested validation/score ranges, selection replacement, fresh-session persistence, two-account isolation, rejection of owner fields, throttling, password change and account/session deletion.

## Browser verification

The isolated H2-backed app on port 8081, and then the real MySQL-backed app on port 8080, passed these browser checks with disposable synthetic accounts:

- Registration and automatic login.
- Profile save and reload.
- Academics with subjects, skills, interests, strengths, values and goal saved.
- Dashboard task creation, roadmap creation and milestone completion.
- Analytics using saved academic records.
- All private feature pages opened without JavaScript exceptions.
- Complete assessment submission and result display.
- Logout and fresh login with the same saved journey.
- Mobile profile at 390 × 844, without document horizontal overflow.
- Password change through settings and successful login with the new password.
- Account deletion through settings.

The synthetic account was deleted. `account-browser-result.json` identifies the tested origin/database; `account-dashboard-desktop.png` and `account-profile-mobile.png` are visual evidence. They contain synthetic test data.

Frontend link check: 21 HTML pages, 244 local references, 0 missing. Changed JavaScript files pass syntax checks.

## MySQL status

After the user corrected the local database credentials, the packaged application started successfully against MySQL 26.7 on port 8080 at 11:59 IST on 15 October 2026. Flyway applied V4 to the existing `samved` schema and Hibernate validation passed. The full browser journey above then passed against MySQL, including fresh-login persistence, assessment submission, password change and account deletion. The browser also confirmed the session cookie is HttpOnly and SameSite=Lax. There were no JavaScript exceptions. `account-browser-result.json` records the MySQL origin and final results. The disposable test account and its synthetic private records were deleted; the MySQL app remains running for the user.

External opportunity feeds and every external learning link were not exhaustively checked. Empty opportunity data remains an honest empty state. This is a local integration, not a certification for public deployment.
