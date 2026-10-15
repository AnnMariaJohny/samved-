# Native roadmap viewer — 15 October 2026

Dashboard, Career Roadmap and roadmap catalogue results now show roadmap.sh content inside SAMVED. For plans with source roadmaps, the native graph replaces the three generic starter cards. A selector switches related paths; zoom, map/topic views, search and a details panel support desktop and mobile. Roadmap topic explanations and linked roadmap.sh guides are rendered locally. Optional third-party learning-resource links are labelled as external.

The source frontend graph contains 156 nodes, including 120 learning topics/subtopics, and 69 edges. Coordinates and connections come from the configured Parse API's `get_roadmap_detail`; topic explanations come from the cached clean tree or `get_topic_detail`. Linked guides use `get_guide_content`. No iframe or reverse proxy bypasses roadmap.sh's SAMEORIGIN framing restriction. Provider markup is never inserted as HTML; Markdown and allowed rich-text nodes are rendered with DOM text nodes and validated links.

Authenticated routes: `GET /api/v1/roadmaps/content?slug=frontend`, `/content/topic?slug=frontend&nodeId=...`, `/content/guide?slug=...`. Slugs and node IDs are validated; topic requests must belong to the source graph. Provider keys stay server-side. Successful snapshots persist in ignored `backend/.roadmap-cache/`; `SAMVED_ROADMAP_CACHE_DIR` overrides that directory. Cached content works without a provider key. New content is limited to 40 provider requests/hour per server instance; upstream failure has a visible error/retry state. Frontend and backend graph snapshots were verified live; other paths load on demand.

Content is used for this user's local personal app under roadmap.sh's [license](https://github.com/nilbuild/developer-roadmap/blob/master/license). Republishing the content requires source-owner permission. Keep snapshots out of Git/public distribution. Source attribution remains in the viewer. This change does not copy third-party lessons or roadmap.sh account/progress/AI-tutor features.

Browser evidence: `native-roadmap-result.json`, `native-roadmap-dashboard.png`, `native-roadmap-mobile.png`. A disposable MySQL account verified the graph replaces generic cards, topic text opens locally, the linked Internet guide opens locally, search works, switching to Backend renders its graph, Career Roadmap uses the viewer, and the dedicated view fits a 390px mobile viewport. No JavaScript exceptions occurred; no new tab or roadmap.sh navigation occurred when opening the tested topic/guide. The disposable account was deleted.

Unit tests cover persistent caching across service restarts, operation without a key after caching, unsafe slugs, topic membership, nested cached descriptions, failed upstream responses and guide-query/rich-content caching. Existing account and application tests remain in the suite.

Final `mvn test`: 55 tests, 0 failures/errors, 3 optional live tests skipped (52 passed). JavaScript syntax checks passed. The frontend link check found 22 HTML pages, 267 local references and 0 missing targets. The updated application was packaged and restarted against MySQL after verification.

Progress tracking in the existing SAMVED module continues to track its saved milestones and tasks. The imported source graph is a learning viewer and does not claim to synchronise roadmap.sh account progress.
