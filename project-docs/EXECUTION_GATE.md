# EXECUTION GATE

CONTROL_VERSION: 4

TASK_ID:
P2-WP001

TITLE:
Campaign Authoring Contract & OA Isolation

STATUS:
AUTHORIZED_FOR_EXECUTION

CODE_BASELINE_HEAD:
7204f6b1c08ffa4f4ab6b7b071f3d34d1900bf7b

AUTHORIZED_BY:
Project Owner

CONTROL_PLANE:
ChatGPT

EXECUTION_PLANE:
Antigravity

CANONICAL_BRANCH:
main

PROJECT_STATE:
PHASE_0: CLOSED / PASS
PHASE_1: CLOSED / PASS
PHASE_2: IN PROGRESS
PHASE_2_TITLE: Campaign Builder v2
ACTIVE_WORK_PACKAGE: P2-WP001
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_REVIEW

--------------------------------------------------
OBJECTIVE
--------------------------------------------------

Make campaign creation, campaign reads, template reuse,
scheduled-campaign reads, pause, resume and reschedule operations
fail-closed, active-OA isolated and governed by an authoritative
server-side campaign authoring contract.

Do this BEFORE Campaign Preview / Template Reuse V2 UI work.

--------------------------------------------------
AUTHORIZED IMPLEMENTATION FILES
--------------------------------------------------

- src/app.controller.ts
- src/app.controller.spec.ts
- index.html

Supporting docs:

- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md

--------------------------------------------------
PROHIBITED
--------------------------------------------------

- run/**
- Worker changes
- runtime-version.ts changes
- entities/**
- DB schema/migrations
- campaign send-plan changes
- ARM/CONFIRM changes
- send ledger changes
- lease/reconciliation behavior changes
- LINE DOM/send behavior
- Telegram behavior
- analytics redesign
- UI redesign outside compatibility changes required by this task

Worker remains:
28.16

Required Worker remains:
28.16

Runtime Contract remains:
2

--------------------------------------------------
1. AUTHORITATIVE MESSAGE TYPE CONTRACT
--------------------------------------------------

Allowed message types ONLY:

- text
- text_link
- image_only
- image_link
- link_only

Any other messageType:
HTTP 400 / fail closed.

Contract:

text:
- non-empty message REQUIRED
- imageUrl prohibited
- linkUrl prohibited

text_link:
- non-empty message REQUIRED
- valid linkUrl REQUIRED
- imageUrl prohibited

image_only:
- valid imageUrl REQUIRED
- linkUrl prohibited
- message not required

image_link:
- valid imageUrl REQUIRED
- non-empty message REQUIRED
- valid linkUrl REQUIRED

link_only:
- valid linkUrl REQUIRED
- imageUrl prohibited
- message optional

Trim textual inputs before validation/persistence where appropriate.

Do not silently coerce an unknown messageType to text.

--------------------------------------------------
2. URL VALIDATION
--------------------------------------------------

For imageUrl/linkUrl when required:

- must parse as a URL
- protocol must be http: or https:
- reject malformed values
- reject unsupported protocols such as:
  javascript:
  data:
  file:
  ftp:

Local uploaded image URLs such as:
http://localhost:<port>/api/uploads/...
must remain valid.

Frontend must send only fields relevant to the selected message type
so hidden stale form values cannot violate the authoritative contract.

--------------------------------------------------
3. SCHEDULE CONTRACT
--------------------------------------------------

If scheduledAt is absent/blank:
campaign is immediate/pending.

If scheduledAt is supplied:

- must be a valid datetime
- must represent a future time
- invalid datetime => reject
- past/current datetime => reject
- NEVER silently convert invalid/past schedule into immediate send

Frontend datetime-local value should be normalized to an unambiguous
ISO timestamp before POST where practical.

--------------------------------------------------
4. ACTIVE OA ISOLATION — READS
--------------------------------------------------

The following endpoints must be explicitly OA scoped:

GET /api/campaigns
GET /api/campaigns/templates
GET /api/campaigns/scheduled
GET /api/campaigns/:id

Use botId from the dashboard request.

Requirements:

- botId must be valid
- botId must equal current activeBotId
- campaign rows returned must have campaign.botId == botId
- template history must contain only that OA
- scheduled list must contain only that OA
- campaign detail must not reveal another OA's campaign/jobs

Cross-OA campaign detail should behave as not found for the requested OA
rather than leaking foreign campaign content.

Update index.html calls to pass currentActiveBotId explicitly.

--------------------------------------------------
5. ACTIVE OA ISOLATION — MUTATIONS
--------------------------------------------------

Apply active-OA fencing to:

POST /api/campaign/pause
POST /api/campaign/resume
POST /api/campaign/reschedule

Dashboard must send botId.

Require:

- valid botId
- botId == current activeBotId
- campaign exists with campaign.id AND campaign.botId == botId

Never mutate a campaign belonging to another OA.

--------------------------------------------------
6. STATE-SAFE MUTATIONS
--------------------------------------------------

PAUSE:

Allowed only from:
- pending
- scheduled
- processing

Reject:
- paused
- paused_reconcile
- completed
- failed
- stopped_limit
- stopped_error
- stopped_user
- other terminal/unknown states

RESUME:

Allowed ONLY from:
- paused

Never normal-resume:
- paused_reconcile

On successful resume:
- if scheduledAt remains in the future => scheduled
- otherwise => pending

Do not jump directly to processing merely because schedule time passed.

RESCHEDULE:

Allowed ONLY when campaign is:
- scheduled
- paused

New scheduledAt:
- required
- valid
- future only

If original status is paused:
remain paused.

If original status is scheduled:
remain scheduled.

Never reschedule completed/failed/stopped/processing/
paused_reconcile campaigns.

--------------------------------------------------
7. PRESERVE EXISTING SAFETY
--------------------------------------------------

Do NOT weaken:

- active OA runtime fencing
- target OA membership verification
- blocked-recipient exclusion
- duplicate-target exclusion
- durable leases
- heartbeat
- pre-send lease renewal
- send-part ARM/CONFIRM
- ambiguity quarantine
- reconciliation fencing
- account protection
- Worker 28.16
- Runtime Contract 2

Permanent policy:

Never automatically resend an ambiguous physical send.

True exactly-once physical LINE delivery is not guaranteed.

--------------------------------------------------
8. TESTS
--------------------------------------------------

Add focused Jest tests covering at minimum:

AUTHORING CONTRACT
1. valid text
2. text without message rejected
3. valid text_link
4. text_link without link rejected
5. invalid URL rejected
6. unsupported URL protocol rejected
7. valid image_only
8. image_only without image rejected
9. valid image_link
10. image_link missing required field rejected
11. valid link_only
12. unknown messageType rejected
13. irrelevant prohibited content rejected

SCHEDULE
14. immediate campaign with no scheduledAt accepted
15. valid future scheduledAt accepted
16. malformed scheduledAt rejected
17. past/current scheduledAt rejected

OA READ ISOLATION
18. campaigns list scoped to botId
19. templates scoped to botId
20. scheduled campaigns scoped to botId
21. campaign detail scoped to botId
22. cross-OA detail not exposed
23. requested botId != activeBotId rejected

OA MUTATION ISOLATION
24. cross-OA pause rejected
25. cross-OA resume rejected
26. cross-OA reschedule rejected

STATE SAFETY
27. valid pending/scheduled/processing pause behavior
28. terminal pause rejected
29. paused_reconcile pause/reuse path rejected
30. resume only from paused
31. paused_reconcile resume rejected
32. resume future schedule => scheduled
33. resume elapsed/no schedule => pending
34. reschedule scheduled accepted
35. reschedule paused accepted and remains paused
36. processing/terminal/paused_reconcile reschedule rejected
37. invalid/past reschedule rejected

FRONTEND CONTRACT
38. campaign/template/scheduled/detail reads include botId
39. pause/resume/reschedule send botId
40. frontend sends only message-type-relevant content
41. scheduledAt is normalized before submission
42. no Worker/runtime/send-ledger source changes

Also preserve existing tests.

Run:

npm test -- --runInBand
npm run build

Record ACTUAL results.

All test evidence must be classified:

LOCAL REPORTED evidence

Do not claim GitHub CI unless independently present.

--------------------------------------------------
9. UAT
--------------------------------------------------

NO LIVE LINE SEND UAT required for P2-WP001.

This task validates authoring/backend/dashboard contracts only.

Do not create a real sending campaign merely to prove this WP.

If runtime UI validation is performed:
Master Bot must remain PAUSED and zero LINE sends must occur.

--------------------------------------------------
10. COMPLETION STATE
--------------------------------------------------

After implementation:

P2-WP001:
READY_FOR_CHATGPT_REVIEW

PHASE_2:
IN PROGRESS

ACTIVE_WORK_PACKAGE:
P2-WP001

NEXT_CANDIDATE:
NONE

NEXT_CANDIDATE_STATUS:
PENDING_REVIEW

Worker:
28.16

Required Worker:
28.16

Runtime Contract:
2

Commit implementation as:

feat: harden campaign authoring and OA isolation

Push origin main.

Fetch origin.

Prove:

- HEAD
- origin/main
- HEAD == origin/main
- clean working tree
- exact changed-file list

STOP.

Do not close P2-WP001 yourself.
Do not start P2-WP002.
Do not perform Live LINE sends.
