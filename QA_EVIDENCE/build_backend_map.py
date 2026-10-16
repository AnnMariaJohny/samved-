"""Rebuild the public architecture snapshot from explicit, verified source anchors.

No filesystem browsing endpoint or private configuration is exposed by the app.
Run from the repo root after changing the referenced backend methods.
"""
from pathlib import Path
import json,hashlib,datetime

ROOT=Path(__file__).resolve().parents[1]
JAVA='backend/src/main/java/io/samved/'
PORTAL='SAMVED_Portal_Updated/JAVA PROJECT OOP/'
features=[]

def ref(file,anchor,count=18):
    path=file if file.startswith(('backend/','SAMVED_','QA_')) else JAVA+file
    lines=(ROOT/path).read_text(encoding='utf-8-sig').splitlines()
    hits=[i for i,line in enumerate(lines) if anchor in line]
    assert len(hits)==1,(path,anchor,hits)
    start=max(0,hits[0]-1);end=min(len(lines),start+count)
    return {'path':path,'symbol':anchor,'start':start+1,'end':end,'code':'\n'.join(lines[start:end]),'sha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest()}

def feature(id,lane,title,tag,brief,why,flow,logic,apis,tables,guard,refs):
    features.append(dict(id=id,lane=lane,title=title,tag=tag,brief=brief,why=why,flow=flow,logic=logic,apis=apis,tables=tables,guard=guard,refs=refs))

feature('client',0,'Student interface','HTML · Fetch','One portal, one origin, many connected features.',
 'Turn saved backend state into a clear student journey.',
 ['An updated portal page loads the shared API client.','Fetch sends session cookies; writes include the CSRF token.','JSON responses render into the original lavender portal.','Dashboard assembles the saved plan, tasks, progress, careers, paths and opportunities.'],
 ['The active frontend is SAMVED_Portal_Updated/JAVA PROJECT OOP, packaged into the Spring Boot JAR by Maven.','portal-app.js owns page rendering; portal-onboarding.js owns the guided journey and preparation.','Preparation runs four requests in parallel and labels success, fallback or failure. It is real request status, not a fake AI percentage.','This explorer is static architecture documentation, not a live request monitor. Journal storage is not implemented; that page directs students to saved tasks.'],
 ['POST /api/v1/action-plan/ensure','GET /api/v1/tasks','GET /api/v1/progress/me','GET /api/v1/recommendations/me'],[],
 'Shared JSON error handling returns useful validation messages; the browser renders content with text nodes rather than injecting provider HTML.',
 [ref(PORTAL+'portal-app.js','async function dashboard(parent)',24),ref(PORTAL+'portal-onboarding.js','async function preparation(parent)',23),ref('backend/pom.xml','../SAMVED_Portal_Updated/JAVA PROJECT OOP',12),ref('common/ApiErrors.java','public class ApiErrors',18)])

feature('auth',0,'Identity & security','Session · BCrypt','Authenticate once; derive ownership on the server.',
 'Keep every student’s profile, tasks and results separated.',
 ['CSRF token is fetched before a write.','Register hashes the password; login checks credentials.','Login replaces the previous session and stores the student/account IDs.','Private APIs read ownership from that server-side session.'],
 ['Spring Security requires authentication for /api/v1/** except the explicit auth entry routes.','BCrypt hashes passwords; session cookies are HttpOnly and SameSite=Lax. Secure cookies are configurable for HTTPS deployment.','Login/register are limited to 20 requests per address in a one-minute window.','Password changes rotate the session ID and update its version; AccountSessionFilter invalidates deleted or outdated accounts.'],
 ['GET /api/v1/auth/csrf','POST /api/v1/auth/register','POST /api/v1/auth/login','POST /api/v1/auth/logout','PUT /api/v1/auth/password'],['users','student_profiles'],
 'The client cannot choose a student ID in a request body. Session identity and repository ownership checks decide access.',
 [ref('config/WebSecurity.java','SecurityFilterChain securityFilterChain',23),ref('auth/AuthController.java','ProfileService.View login(',22),ref('auth/LoginThrottle.java','public synchronized void check',10),ref('common/StudentContext.java','public long requireStudentId()',17),ref('auth/AccountSessionFilter.java','protected void doFilterInternal',18)])

feature('onboarding',0,'Onboarding gate','8 required sections','Finish the profile before private features unlock.',
 'Ensure personalization uses explicit saved answers rather than assumptions.',
 ['Register or login checks the completion checklist.','First unfinished section becomes the next screen.','Every section persists through the profile or assessment APIs.','Eight complete sections unlock dashboard preparation.'],
 ['Order: personal details → academics → career direction → interests → skills → strengths → values → assessment.','Career direction can explicitly remain Exploring; the review marker distinguishes that choice from an unvisited section.','The server interceptor blocks private feature APIs with 403 ONBOARDING_REQUIRED; direct feature pages redirect to the first unfinished section.','The judge shortcut creates a separate sample account through normal APIs. It does not bypass backend completion checks; Exit demo deletes that account.'],
 ['GET /api/v1/students/me/onboarding','PUT /api/v1/students/me/review/career'],['student_profiles','assessment_responses'],
 'Students may revisit completed steps; future setup pages remain locked. BV documentation itself is public and does not unlock feature APIs.',
 [ref('roadmap/PersonalRoadmapService.java','private Checklist checklist(',25),ref('config/OnboardingAccess.java','public boolean preHandle',27),ref(PORTAL+'portal-onboarding.js','async function createDemo(',25)])

feature('profile',0,'Profile & academics','Validation · JSON','Collect the signals used throughout the backend.',
 'Maintain one authoritative onboarding profile in MySQL.',
 ['Forms send personal details, academics or a selected category.','Bean validation and service rules validate lengths, levels and score scales.','ProfileService replaces the requested section atomically.','Snapshots supply interests, skills, values, strengths and goal to other engines.'],
 ['Profile sections are bounded JSON documents stored on student_profiles, with an optimistic version column.','Academic records include course, period, score scale and subject marks. CGPA is checked against its selected 10-point scale.','Skill entries include proficiency. Daily planning uses proficiency; the original deterministic career score compares skill names.','Academics inform daily-plan context. Grades are not used to reject learning paths or predict admission.'],
 ['GET /api/v1/students/me','PUT /api/v1/students/me','PUT /api/v1/students/me/academics','PUT /api/v1/students/me/skills','PUT /api/v1/students/me/{interests|strengths|values}'],['student_profiles'],
 'Every profile route uses the current session’s owner. Unknown fields cannot assign another student’s identity.',
 [ref('student/StudentController.java','class StudentController',18),ref('student/ProfileService.java','public record Academic',13),ref('student/ProfileService.java','public View update(',18),ref('student/StudentProfile.java','public class StudentProfile',22)])

feature('assessment',1,'Assessment themes','Frequency counting','Eight answers become descriptive preference signals.',
 'Add assessment evidence without claiming an aptitude prediction.',
 ['Load the current versioned question catalogue.','Submit all eight unique question/option pairs.','Count themes from seven questions; store confidence separately.','Pass all tied leading themes to career and roadmap matching and daily planning.'],
 ['Each themed answer adds one count. The largest count wins; ties are preserved and sorted.','Themes include Technology, Research, Service, Creativity and Leadership, plus descriptive working-style themes.','The confidence question is not added to theme counts.','The questionnaire is custom and descriptive, not a validated psychometric test. Not every stored theme has a career-catalogue mapping.'],
 ['GET /api/v1/assessments/current','PUT /api/v1/assessments/current/responses','GET /api/v1/assessments/current/result'],['assessment_responses'],
 'A complete, valid replacement is checked before deleting previous responses. Unknown versions, duplicate questions and invalid options are rejected.',
 [ref('assessment/AssessmentCatalog.java','private static final List<Question>',18),ref('assessment/AssessmentService.java','public Result resultForStudent(',36),ref('assessment/AssessmentService.java','private void validate(',25)])

feature('careers',1,'Career match & AI','Rules + NVIDIA NIM','Explainable candidates, then AI fit estimates.',
 'Show why careers fit and what skills the student could build next.',
 ['Read the profile snapshot, leading themes and career catalogue.','Java computes weighted overlaps and selects up to five positive candidates.','NVIDIA NIM selects/orders those candidates and estimates preference alignment.','Java validates IDs and percentages; the UI displays explanations and skill gaps.'],
 ['Rule caps: interests 30, skills 35, strengths 15, values 10, exact goal 10; a leading assessment-theme match adds 10. Total is capped at 100.','Each overlap category uses round(matched ÷ catalogue category size × category cap). Skill gaps are required skills minus stated skills.','AI match percent is separate from the original Java score. It estimates onboarding preference alignment, not employment probability.','NIM uses a configurable model, default openai/gpt-oss-20b. Output is bounded JSON; fabricated/duplicate IDs or invalid match data are rejected.','Session cache: successful AI results 10 minutes; rules/fallback 1 minute. Profile/theme changes invalidate the cache.'],
 ['GET /api/v1/recommendations/me','GET /api/v1/careers'],['careers','student_profiles','assessment_responses'],
 'Names, emails and account IDs are excluded from the AI payload. Missing configuration uses RULES; provider or validation errors use RULES_FALLBACK. The UI labels the source.',
 [ref('recommendation/RecommendationService.java','int interestPoints =',20),ref('recommendation/AiRecommendationService.java','JsonNode ranking = askModel',30),ref('recommendation/AiRecommendationService.java','ObjectNode profile =',24),ref('recommendation/RecommendationController.java','Object cached=',13)])

feature('actionplan',1,'AI daily action plan','7 dated activities','Convert onboarding into a manageable learning week.',
 'Automatically give students concrete actions, not only recommendations.',
 ['POST ensure locks this student’s profile row.','Hash onboarding inputs and assessment counts; reuse an unexpired identical plan.','AI proposes seven unique activities with descriptions and 15–60 minute estimates.','Java assigns one date per activity and persists real task records plus plan metadata.'],
 ['The prompt uses education, courses, subjects, interests, skill proficiency, strengths, values, goal and assessment themes; account identity is excluded.','The SHA-256 input fingerprint and student-specific pessimistic lock prevent refresh/tab duplicates.','Changed inputs replace only future pending automatic assignments. Completed, overdue, in-progress, manual and student-edited tasks remain.','Week dates use Asia/Kolkata. An expired plan renews on the next visit or through the nightly scheduler.','AI failure produces a clearly labelled GUIDED starter week. Stored plans are reused; generation attempts have a server-wide 30-per-hour cap.'],
 ['POST /api/v1/action-plan/ensure'],['student_action_plans','learning_tasks','student_profiles','assessment_responses'],
 'Ownership and dates are assigned by Java. Model output cannot choose another student, arbitrary deadlines or executable actions.',
 [ref('task/ActionPlanService.java','public View ensure(',35),ref('task/ActionPlanService.java','private String fingerprint(',9),ref('task/AiActionPlanner.java','public Draft generate(',28),ref('task/AiActionPlanner.java','Draft parse(',17),ref('student/StudentProfileRepository.java','@org.springframework.data.jpa.repository.Lock',4)])

feature('opportunities',1,'Opportunity matching','Real feeds · Ranking','Rank actual listings against onboarding signals.',
 'Surface relevant opportunities without fabricating listings.',
 ['Scheduled feeds validate and update listings by source URL.','Filter published, current and recently verified candidates.','Match interests, skills and goal-related phrases against listing fields.','Rank up to 1,000 candidates, paginate and show up to five positive dashboard matches.'],
 ['Per signal: title match 4 points; otherwise summary 2; otherwise organizer/type 1. Normalized duplicate signals count once.','Unicode normalization, case folding and phrase boundaries reduce accidental substring matches.','Supported goal keywords expand research/scientist, software/developer and design searches.','Ranking ties use newest verification, then ID. Normal feed mode hides known expired listings and those not checked in the last 30 days.','Unstop imports and opt-in JSON feeds supply actual listings. Eligibility remains source information; relevance is not eligibility verification.'],
 ['GET /api/v1/opportunities?size=5','GET /api/v1/opportunities?type=INTERNSHIP'],['opportunities'],
 'This matcher is Java rules, not an AI-generated opportunity feed. Zero matches produce an honest empty state and a browse link.',
 [ref('opportunity/OpportunityMatcher.java','public static Match match(',32),ref('opportunity/OpportunityController.java','Instant oldestReview',35),ref('opportunity/OpportunityImporter.java','findBySourceUrl',13),ref('opportunity/UnstopOpportunityRefresh.java','public void refresh()',16)])

feature('roadmaps',2,'Learning roadmaps','Weighted search · Graph','Find, explore and save real learning paths.',
 'Connect profile interests to structured learning resources.',
 ['Parse supplies the roadmap.sh catalogue; MySQL retains a copy.','Weighted aliases/keywords rank personalized catalogue paths.','The viewer loads graph nodes and topic details through the backend.','Students save/activate paths or create tracked starter milestones.'],
 ['Personalized signal weights: goal 9, interests 6, skills 5, assessment 3, strengths 2, values 1. Match points are multiplied by these weights; top six positive paths are returned.','Known aliases score 6/5/4/3 by alias position; otherwise meaningful word matches add 2. Stop words are removed.','Topic search is separate: full query 20, known alias 16, title/ID term 4, description term 1; top eight results.','For-role lookup returns an exact catalogue match first, otherwise a labelled AI-generated five-milestone plan. Saved starter milestones use predefined templates.','Graph rendering uses source coordinates and SVG curves. Topic-tree lookup is recursive depth-first search with a depth bound, not a shortest-path algorithm.'],
 ['GET /api/v1/roadmaps/guidance','GET /api/v1/roadmaps/catalogue','GET /api/v1/roadmaps/discover?query=research','GET /api/v1/roadmaps/content?slug=python','GET /api/v1/roadmaps/for-role?jobTitle=Research%20Scientist','POST /api/v1/roadmaps','PATCH /api/v1/milestones/{id}/status'],['roadmap_catalogue_entries','student_profiles','roadmaps','roadmap_milestones'],
 'Provider keys remain server-side. Invalid slugs and nodes are rejected; catalogue/content caches avoid repeat fetches. A developer-focused catalogue may not cover every profession.',
    [ref('roadmap/PersonalRoadmapService.java','public List<Choice> rank(',25),ref('roadmap/RoadmapDiscoveryService.java','private static int score(',17),ref('roadmap/RoleRoadmapService.java','public RoleRoadmap forRole(',18),ref('roadmap/RoadmapContentService.java','private JsonNode find(',8),ref(PORTAL+'api/roadmap-viewer.js','function draw(){',18)])

feature('tasks',2,'Daily tasks','Shared persisted records','Automatic assignments and personal tasks live together.',
 'Make learning actions editable and trackable across the portal.',
 ['AI planner or a student creates a task.','Server derives the owner and validates optional roadmap/milestone links.','Tasks persist with a due date, status and automatic-plan marker.','Complete, edit, reopen or delete updates the same record used everywhere.'],
 ['Statuses are PENDING, IN_PROGRESS and COMPLETED.','Editing an automatic task clears its automatic-plan key, preserving that student-owned change during future replanning.','Changing the title/date clears obsolete reminders. Completing/deleting a task also clears its reminders.','Tasks cannot be reassigned to another roadmap or milestone during editing; referenced resources must belong to the current student.'],
 ['GET /api/v1/tasks','POST /api/v1/tasks','PUT /api/v1/tasks/{id}','PATCH /api/v1/tasks/{id}/status','DELETE /api/v1/tasks/{id}'],['learning_tasks'],
 'Repository lookups use task ID AND owner. Foreign IDs return not found instead of revealing another account’s work.',
 [ref('task/LearningTaskService.java','public TaskView create(',14),ref('task/LearningTaskService.java','public TaskView update(',21),ref('task/LearningTaskService.java','private LearningTask owned(',6),ref('task/LearningTask.java','public void update(',8)])

feature('planner',2,'Planner & deadlines','Same tasks · Date ordering','One assignment, consistent across three screens.',
 'Avoid disconnected calendars and duplicate deadline records.',
 ['Ensure the saved weekly plan is available.','Read the same /tasks endpoint used by Daily Tasks.','Filter dated tasks and sort by due date.','Show scheduled work and load due-date reminders.'],
 ['Planner and Deadline System are views of learning_tasks, not separate databases or AI schedulers.','Java assigns automatic task dates; students can edit their own dates.','Dashboard shows today/overdue actions and an upcoming seven-row schedule.','Completing a task from any view is reflected in the next progress read.'],
 ['POST /api/v1/action-plan/ensure','GET /api/v1/tasks','GET /api/v1/notifications'],['learning_tasks','task_notifications'],
 'Opening this architecture view does not generate or reschedule anything. The actual feature pages use authenticated APIs.',
 [ref(PORTAL+'portal-app.js','async function tasks(parent,dated=false)',16),ref(PORTAL+'portal-app.js','const upcoming=list.filter(',8),ref('task/ActionPlanService.java','var task=new LearningTask',7)])

feature('progress',2,'Progress & charts','Derived completion','Measure saved actions, never invented progress.',
 'Give students visible feedback as they complete their work.',
 ['Read this student’s saved roadmaps and tasks.','Count completed and total milestones and tasks.','Calculate the rounded completion percentage.','Render dashboard totals, a progress ring and daily completion bars.'],
 ['Overall progress = round(100 × (completed tasks + completed milestones) ÷ (total tasks + total milestones)). Empty totals return 0%.','Each task and milestone has equal weight; there is no time-weighted or difficulty-weighted model.','Weekly chart bars compare completed tasks to assigned tasks on each scheduled date.','One completed activity out of seven produces 14%. Completion updates the database before the dashboard redraws.'],
 ['GET /api/v1/progress/me','PATCH /api/v1/tasks/{id}/status','PATCH /api/v1/milestones/{id}/status'],['learning_tasks','roadmaps','roadmap_milestones'],
 'Progress is computed from owner-scoped records, not a separately editable percentage or an AI prediction.',
 [ref('progress/ProgressController.java','public ProgressView mine()',16),ref(PORTAL+'portal-app.js','function progressChart(',11),ref('task/LearningTaskService.java','public TaskView changeStatus(',10)])

feature('reminders',2,'Deadline reminders','Date rules · Deduplication','Create timely in-app reminders from saved dates.',
 'Bring overdue, today and tomorrow work to the student’s attention.',
 ['Hourly scan or notification read checks incomplete dated tasks.','Compare the due date with today in the configured zone.','Create OVERDUE, DUE_TODAY or DUE_TOMORROW if missing.','Return the current student’s latest 50 notifications; allow mark-read.'],
 ['A task + due date + reminder kind check prevents identical reminders from being added repeatedly.','Completed tasks and tasks without dates do not generate reminders.','Task edits remove superseded reminders before saving the new details.','These are in-app notifications, not email/SMS delivery.'],
 ['GET /api/v1/notifications','PATCH /api/v1/notifications/{id}/read'],['learning_tasks','task_notifications'],
 'Notification lookup and mark-read are owner-scoped. The browser cannot read another student’s reminders.',
 [ref('notification/TaskNotificationService.java','public void scanDueTasks()',9),ref('notification/TaskNotificationService.java','private void createIfDue(',20),ref('notification/TaskNotificationService.java','public List<View> mine()',12)])

feature('storage',3,'MySQL & persistence','JPA · Flyway V1–V6','A single relational store backs the portal.',
 'Persist student work across refreshes, logouts and server restarts.',
 ['Spring Boot configures the MySQL datasource.','Flyway applies versioned schema migrations.','JPA repositories read/write entities inside service transactions.','Owner IDs and relational links connect profiles, work and results.'],
 ['Java 17 + Spring Boot + Spring Data JPA/Hibernate; Maven packages backend and updated frontend into one executable app.','users → student_profiles is a database foreign key. Roadmap milestones reference roadmaps; optional task links reference roadmaps/milestones.','Other student_id columns are ownership keys used by services. They are not all declared as foreign keys to student_profiles.','JSON profile sections and roadmap preferences are stored in bounded text columns. Automatic plans use student_id as their primary key.','V1 core domain, V2 reminders, V3 catalogue cache, V4 accounts/profiles, V5 preferences/review markers, V6 action plans and provenance.'],
 ['JPA repositories → SQL → MySQL'],['users','student_profiles','assessment_responses','careers','roadmap_catalogue_entries','roadmaps','roadmap_milestones','learning_tasks','task_notifications','opportunities','student_action_plans'],
 'The browser has no SQL connection. Credentials come from server environment/configuration and are never included in this explorer.',
 [ref('backend/pom.xml','<java.version>',11),ref('backend/src/main/java/db/migration/V4__accounts_and_profiles.java','CREATE TABLE student_profiles',22),ref('backend/src/main/java/db/migration/V6__automatic_action_plans.java','public void migrate(',7),ref('task/StudentActionPlan.java','public class StudentActionPlan',10)])

feature('providers',3,'External services','NIM · Parse · Feeds','External calls stay behind Java boundaries.',
 'Use AI and current learning/opportunity sources while validating their responses.',
 ['Backend selects the configured provider and sends bounded data.','HTTP clients apply connection/response timeouts.','JSON output and identifiers are validated.','Validated results are cached/persisted or replaced by a labelled fallback.'],
 ['NVIDIA NIM: career reranking/match estimates, seven-day activity generation and optional role roadmap generation. This app does not train its own model.','Parse: roadmap.sh catalogue, graph and topic content. MySQL/file caches retain fetched data.','Unstop and explicitly configured HTTPS JSON feeds: actual opportunity imports with source attribution.','AI plan fallback is GUIDED; career fallback is RULES_FALLBACK. Missing roadmap content reports unavailable instead of inventing content.'],
 ['NVIDIA /v1/chat/completions','Parse roadmap catalogue/content endpoints','Unstop public opportunity search','Configured opt-in HTTPS JSON feeds'],['roadmap_catalogue_entries','opportunities','student_action_plans','learning_tasks'],
 'Provider API keys remain on the server. The architecture snapshot includes variable names and code, never runtime credential values or student data.',
 [ref('recommendation/AiRecommendationService.java','private static final URI NVIDIA_CHAT_API',8),ref('task/AiActionPlanner.java','var call=HttpRequest.newBuilder',7),ref('roadmap/ParseRoadmapCatalogue.java','public synchronized List<RoadmapSummary> list()',20),ref('opportunity/OpportunityFeedRefresh.java','void refreshOne(',17)])

feature('scheduling',3,'Background jobs','Spring @Scheduled','Keep plans, reminders and feeds moving.',
 'Run recurring backend work even when the browser is closed, while the server is running.',
 ['Spring’s scheduler triggers a configured job.','The job reads expired plans, due tasks or provider feed configuration.','Services validate and update the corresponding records.','The next student read shows the persisted results.'],
 ['Action-plan renewal runs at 00:10 Asia/Kolkata for expired saved weeks; a signed-in visit also repairs an expired week after downtime.','Reminder scanning defaults to an hourly fixed delay.','Configured opportunity feeds and enabled Unstop imports default to a six-hour fixed delay.','Jobs are in-process Spring schedules, not an external queue. They require the app to be running. Provider limits and configuration still apply.'],
 ['No browser request required for scheduled runs'],['student_action_plans','learning_tasks','task_notifications','opportunities'],
 'Per-profile renewal failures do not stop other saved plans. Feed category failures do not stop remaining categories.',
 [ref('task/ActionPlanScheduling.java','@Scheduled(',7),ref('notification/TaskNotificationService.java','@Scheduled(',9),ref('opportunity/OpportunityFeedRefresh.java','@Scheduled(',14),ref('opportunity/UnstopOpportunityRefresh.java','@Scheduled(',16)])

feature('deletion',3,'Privacy & cleanup','Transactional deletion','Remove one student’s saved data in dependency order.',
 'Support explicit account deletion and clean disposal of judge-demo accounts.',
 ['Student requests account deletion.','Account service resolves the current owner.','Delete notifications, tasks, automatic plan, milestones, roadmaps and assessment responses.','Delete profile/account and end the session.'],
 ['Child records are deleted before their parent roadmap/profile/account records.','Private deletion is scoped to the requested server-resolved student ID. Shared careers, public opportunities and the catalogue remain.','Judge-demo Exit uses the normal delete-account API.','Deletion does not remove external providers’ records, backups or server logs.'],
 ['DELETE /api/v1/students/me'],['task_notifications','learning_tasks','student_action_plans','roadmap_milestones','roadmaps','assessment_responses','student_profiles','users'],
 'The architecture page never invokes deletion. It is documentation only, with no private runtime data.',
 [ref('common/DeveloperADataDeletion.java','public void deleteForStudent(',12),ref('auth/AccountService.java','public void delete(',12),ref('student/StudentController.java','@DeleteMapping',4)])

edges=[['client','auth'],['auth','onboarding'],['onboarding','profile'],['profile','assessment'],['assessment','careers'],['profile','actionplan'],['assessment','actionplan'],['profile','opportunities'],['profile','roadmaps'],['careers','providers'],['actionplan','providers'],['actionplan','tasks'],['tasks','planner'],['tasks','progress'],['tasks','reminders'],['roadmaps','progress'],['tasks','storage'],['profile','storage'],['opportunities','storage'],['providers','storage'],['scheduling','actionplan'],['scheduling','reminders'],['scheduling','opportunities'],['deletion','storage']]
traces=[
 {'title':'Student → personalised dashboard','steps':[['client','A student opens the portal and submits their details.'],['auth','Spring Security verifies the session; CSRF protects writes.'],['onboarding','The server requires all eight onboarding sections.'],['profile','The profile stores the student’s interests, goal and skills.'],['assessment','Answers become descriptive preference themes.'],['careers','Rules find candidates; NIM estimates career alignment.'],['actionplan','AI proposes a seven-day learning plan; Java schedules it.'],['storage','MySQL persists the plan and its seven task records.'],['planner','Planner and deadlines read the same dated assignments.'],['opportunities','Relevant actual listings are ranked against onboarding.'],['progress','The dashboard displays saved tasks and computed progress.']]},
 {'title':'Complete today’s activity','steps':[['client','The student presses Mark complete.'],['auth','The write must have a valid session and CSRF token.'],['tasks','The service looks up task ID plus current owner.'],['reminders','Completion clears reminders for that task.'],['storage','The task status becomes COMPLETED in MySQL.'],['progress','Completed/total counts are recalculated.'],['client','The progress ring and weekly bars redraw from persisted values.']]},
 {'title':'AI planning, duplicates & fallback','steps':[['actionplan','The ensure request starts a student-scoped transaction.'],['profile','A pessimistic profile lock serializes simultaneous tabs.'],['actionplan','A fingerprint reuses an identical, unexpired saved week.'],['providers','NIM receives bounded learning signals, excluding account identity.'],['actionplan','Validate seven unique activities; failures select a labelled guided week.'],['tasks','Java creates dated assignments with automatic-plan provenance.'],['storage','Save the plan fingerprint and coverage end date.'],['scheduling','An expired week renews nightly or on the next visit.']]}
]
data={'version':'2026-10-16','lanes':['Entry & identity','Personalisation engines','Learning & follow through','Data & operations'],'features':features,'edges':edges,'traces':traces,'repository':'https://github.com/AnnMariaJohny/samved-','note':'Verified source snapshot · architecture walkthrough, not live telemetry'}
out=ROOT/PORTAL/'backend-visualization/map-data.js'
out.write_text('window.SAMVED_BACKEND_MAP = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('Verified',len(features),'features and',sum(len(f['refs']) for f in features),'source anchors ->',out.relative_to(ROOT))
