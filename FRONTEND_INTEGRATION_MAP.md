# SAMVED frontend integration map

The only frontend build input is `SAMVED_Portal_Updated/JAVA PROJECT OOP/`.
`backend/pom.xml` no longer packages `frontend/`. The old folder remains on disk
as unused historical source. No pages, styles, or scripts are loaded from it.

The updated folder uses its own HTML pages and layout, with `portal-app.js`
connecting their forms and widgets to the existing Java APIs.

See [the current page and API map](SAMVED_Portal_Updated/README.md),
[the source page index](SAMVED_Portal_Updated/JAVA%20PROJECT%20OOP/portal-page-index.json),
and [legacy URL mappings](SAMVED_Portal_Updated/JAVA%20PROJECT%20OOP/portal-routes.json).

`Start SAMVED.cmd` starts local MySQL as needed, performs a clean build, starts
Spring Boot, and opens `/login.html`. Old `/profile/profile.html` and other
bookmarks redirect to the respective updated source pages.

Verification is recorded in [the replacement report](QA_EVIDENCE/ACTUAL_PORTAL_REPLACEMENT.md).
