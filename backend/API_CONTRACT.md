# SAMVED Developer A API contract (v1)

All routes below use JSON under `/api/v1`. The frontend and backend share one origin. A server-managed authenticated session identifies the student; private request bodies never contain an owner ID. Christa's auth/profile routes in `FRIEND_AUTH_PROFILE_HANDOFF.md` are separate and must supply the session, CSRF token, and `StudentProfilePort` described in `README.md`.

Dates use `YYYY-MM-DD`. Instants use UTC ISO-8601 such as `2026-10-13T17:40:00Z`. Opportunity timezones use IANA IDs such as `Asia/Kolkata`. Unknown fields are JSON `null`; clients must not invent a deadline or progress number.

| Method and route | Input | Output / behavior |
| --- | --- | --- |
| `GET /assessments/current` | Session | `{questionVersion,questions:[{id,text,options:[{id,label,dimension}]}],answers:[{questionId,optionId}]}` |
| `PUT /assessments/current/responses` | `{questionVersion:1,answers:[{questionId,optionId},...]}` | Complete replacement of all eight answers; returns the current object. An option must belong to its question. |
| `GET /assessments/current/result` | Session | `{questionVersion,dimensionCounts,leadingDimensions,careerConfidence,answeredQuestions,explanation}`; 404 until completed. |
| `GET /careers` | Session | List of `{id,title,summary,interests,requiredSkills,strengths,values}`. |
| `GET /careers/{id}` | Career ID | One career or 404. |
| `GET /recommendations/me` | Session | `{ruleVersion,guidance,exploratory,source,recommendations:[{careerId,careerTitle,score,reasons,matchedSkills,skillGaps,matchedInterests,ruleVersion}]}`. `source` is `AI`, `RULES`, or `RULES_FALLBACK`. AI selects/orders candidates when the backend API key is configured; scores/reasons/gaps remain transparent rule calculations. Assessment themes are used only when completed; an uncertain student with no signals gets an empty list. |
| `GET /roadmaps/me` | Session | List of `{id,templateCode,goal,createdAt,milestones:[{id,position,title,description,status}],externalResources:[{source,title,url}]}` newest first. `externalResources` contains links to matching roadmap.sh pages for `SOFTWARE`, `DATA`, and `DESIGN`; other paths return an empty list. |
| `GET /roadmaps/catalogue` | Public | Current roadmap.sh summaries from the configured Parse API: `{id,title,description,url,tags,updatedAt}[]`. Cached for six hours; unavailable if no Parse key and no cached catalogue. |
| `GET /roadmaps/discover?query=...` | Public | Up to eight catalogue entries matching a stated topic or career goal, as `{roadmap,reason}[]`. No account or student data required; no success probability is returned. |
| `GET /roadmaps/for-role?jobTitle=...` | Public | Exact title/ID in the Parse catalogue returns `{source:"ROADMAP_SH",jobTitle,summary,url,milestones:[],model:null,generatedAt:null}`. Otherwise NVIDIA `gpt-oss-20b` returns `{source:"AI_GENERATED",jobTitle,summary,url:null,milestones:[{title,description} x5],model,generatedAt}`. Role-only input is validated; generated plans are starter guidance and are not saved to student milestones. |
| `POST /roadmaps` | `{templateCode,goal}` | Creates a student-owned snapshot of an original template; repeating the same template returns the existing plan. Response also includes `externalResources`. Templates: `EXPLORING`, `SOFTWARE`, `DATA`, `RESEARCH`, `MEDICINE`, `TEACHING`, `DESIGN`, `ENTREPRENEURSHIP`, `CIVIL_ENGINEERING`. |
| `PATCH /milestones/{id}/status` | `{status}` | Returns changed milestone; foreign/missing ID is 404. |
| `GET /tasks` | Session | List of `{id,roadmapId,milestoneId,title,description,dueDate,status,createdAt}` newest first. |
| `POST /tasks` | `{title,description?,dueDate?,roadmapId?,milestoneId?}` | Creates task; linked roadmap/milestone must belong to current student. |
| `PUT /tasks/{id}` | Same task input | Changes title/description/date; does not reassign roadmap/milestone. Foreign/missing ID is 404. |
| `PATCH /tasks/{id}/status` | `{status}` | Returns changed task. |
| `DELETE /tasks/{id}` | Session | 204 after deleting owned task. |
| `GET /notifications` | Session | Generates due reminders if needed; returns up to 50 newest owned `{id,taskId,dueDate,kind,message,createdAt,readAt}` records. |
| `PATCH /notifications/{id}/read` | Session + CSRF token | Marks one owned notification read; foreign/missing ID is 404. |
| `GET /progress/me` | Session | `{completed,total,percent,completedMilestones,totalMilestones,completedTasks,totalTasks}`. When total is zero, percent is zero. |
| `GET /opportunities?type=&includeExpired=false&page=0&size=20` | Optional filters; size 1–50 | `{content:[...],page,size,totalElements,totalPages}`. By default only published, recently verified and unexpired listings are shown, ordered by profile match when available. |

Statuses for milestones and tasks: `PENDING`, `IN_PROGRESS`, `COMPLETED`. Opportunity types: `INTERNSHIP`, `HACKATHON`, `SCHOLARSHIP`, `COURSE`, `EVENT`. Each opportunity card includes source name and URL, application URL, `verifiedAt`, `deadline` and, when known, exact `closesAt` plus `deadlineZone`; `expired` is calculated by the server. `matchScore` and `matchedSignals` explain the ordering against persisted profile interests, skills, and custom goal. The score is not an eligibility determination. The `includeExpired` flag is for review/history, not the default student feed. The newest 1,000 eligible listings are considered for matching before pagination.

Validation failures use HTTP 400. Missing or foreign private IDs use 404. No session uses 401. A connected session with no Christa profile adapter receives 503 on profile-dependent endpoints. An error body has `{code,message,fieldErrors,requestId}`. Writes require Christa's CSRF endpoint and `X-CSRF-TOKEN` header; the frontend helper handles that after login.

Notification kinds are `DUE_TOMORROW`, `DUE_TODAY`, and `OVERDUE`, calculated in the configured reminder timezone. Completing, changing, or deleting a task removes its old reminders. These notifications appear in the app; email, SMS and background browser push are not included.

## Contract freeze for Christa

Christa sets `samvedStudentId` (Java `Long`) in the server session after successful login. That value is the persisted **student profile ID**. Her bean implementing `StudentProfilePort` returns `StudentSnapshot(educationLevel,goalType,goalText,interests,skills,strengths,values)` using that ID. The profile lists contain human-readable normalized labels; skills are exposed as names only for the recommendation rule, while proficiency remains in her own profile DTO. The signed-in account deletion path calls `DeveloperADataDeletion.deleteForStudent(profileId)` inside its transaction. Christa supplies `GET /api/v1/auth/csrf` with `{token}` and rotates/reloads it after login as described in her handoff.
