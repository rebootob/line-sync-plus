# EXECUTION GATE

CONTROL_VERSION: 7

TASK_ID:
P2-WP002

TITLE:
Authoritative Campaign Preview & Safe Template Reuse V2

STATUS:
AUTHORIZED_FOR_EXECUTION

CODE_BASELINE_HEAD:
aebd092ddd1d4802000a58be331de58707a5bcdb

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
P2-WP001: CLOSED / PASS
P2-WP001-R1: CLOSED / PASS
ACTIVE_WORK_PACKAGE: P2-WP002
P2-WP002: AUTHORIZED_FOR_EXECUTION
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_REVIEW

--------------------------------------------------
OBJECTIVE
--------------------------------------------------

Enhance the existing Campaign Builder. Do NOT rebuild from scratch.

Add:
1. Backend-authoritative outbound payload preview (`POST /api/campaign/preview`)
2. Two-step Preview -> Confirm Create dashboard flow (`index.html`)
3. Safe active-OA template reuse DTO (`GET /api/campaigns/templates`)
4. Safe DOM rendering for template labels and preview content (no untrusted `innerHTML`)
5. Stale-preview invalidation when authoring inputs or active OA change

--------------------------------------------------
AUTHORIZED IMPLEMENTATION FILES
--------------------------------------------------

- src/app.controller.ts
- src/app.controller.spec.ts
- index.html

Supporting docs after implementation:
- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md

--------------------------------------------------
PROHIBITED
--------------------------------------------------

- run/**
- LineSyncApp.js
- Worker version (remains 28.16)
- src/runtime-version.ts (Required Worker 28.16, Runtime Contract 2)
- entities/**
- DB schema / migrations
- package*.json
- new npm dependencies
- ARM / CONFIRM
- campaign send ledger
- lease / heartbeat / reconciliation
- recipient verification / OA worker fencing
- SAFE account protection
- LINE DOM/send behavior
- Telegram behavior
- P2-WP003 scheduled queue controls
- analytics redesign
- broad dashboard redesign

--------------------------------------------------
CONTRACT & SPECIFICATIONS
--------------------------------------------------

### A. SHARED AUTHORING / NORMALIZATION CONTRACT
Reuse same authoritative normalization/validation logic in `addCampaign` and `previewCampaign`.
Preserve all P2-WP001 / R1 rules:
- Allowed types: `text`, `text_link`, `image_only`, `image_link`, `link_only`.
- URLs: valid HTTP/HTTPS only (localhost HTTP uploads valid; reject malformed/javascript/data/file/ftp).
- `scheduledAt`: absent/blank => immediate/pending; supplied non-string/null/malformed/past => HTTP 400; future => scheduled.

### B. AUTHORITATIVE PREVIEW ENDPOINT
- `POST /api/campaign/preview`
- Body: `botId`, `name?`, `messageType`, `message?`, `imageUrl?`, `linkUrl?`, `scheduledAt?` (no `targetIds` required).
- Active-OA fenced (`botId === activeBotId`), fail closed if missing/mismatched.
- Read-only: MUST NOT create Campaign/Job/SendPart, update DB, trigger Telegram, send LINE, or mutate Worker state.
- Returns normalized authoring data and ordered outbound parts (`parts: [{ partKey, partOrder, type, content }]`, `immediate: boolean`).

### C. OUTBOUND PREVIEW SEMANTICS
- Matches Worker 28.16 outbound composition (`getRequiredSendParts()` ordering: `image` -> `text`).
- Text content semantically formats link details (`🔗 ดูรายละเอียดเพิ่มเติม: linkUrl` / `🔗 linkUrl`).
- Terminology: "Outbound Payload Preview" / "ตัวอย่างเนื้อหาที่ระบบจะส่ง".

### D. TEMPLATE REUSE V2
- `GET /api/campaigns/templates?botId=...` (active-OA fenced).
- Returns safe DTO: `id`, `name`, `messageType`, `message`, `imageUrl`, `linkUrl`, `createdAt` (excludes targets, status, counts, jobs, internal metadata).
- Returns up to 15 newest valid reusable templates satisfying current contract.

### E. SAFE TEMPLATE DOM RENDERING & FORM REUSE
- Build `<option>` elements using DOM APIs (`document.createElement('option')`, `.textContent = ...`). Zero `innerHTML` interpolation of untrusted template labels.
- Template reuse copies ONLY authoring content fields (`messageType`, `message`, `imageUrl`, `linkUrl`). Does NOT copy schedule, targets, status, or counts.

### F. TWO-STEP PREVIEW -> CONFIRM CREATE & STALE INVALIDATION
- Dashboard flow: Author fields -> Preview -> Render validated preview -> Confirm Create -> `POST /api/campaign/add`.
- Confirm Create remains disabled until form state has a successful preview snapshot.
- Snapshot invalidates on any field edit, template selection, or active OA change.
- `POST /api/campaign/add` pre-flight validates current state against successful preview snapshot.

### G. PREVIEW UI & FAILURE HANDLING
- Enhances existing modal without broad redesign. Safe DOM node rendering (`textContent`).
- Immediate campaign warning displayed.
- API failures fail closed (clear preview, keep Confirm Create disabled).

--------------------------------------------------
TESTS & VERIFICATION PLAN
--------------------------------------------------

- Run: `npm test -- --runInBand`, `npm run build`, `git diff --check`.
- Requires focused backend unit tests (scenarios 1-30) and frontend/harness test coverage (scenarios 31-45).
- Report ACTUAL test totals as LOCAL REPORTED evidence.

--------------------------------------------------
UAT & SAFETY TRUTH
--------------------------------------------------

- NO LIVE LINE SEND UAT required.
- Master Bot must remain PAUSED.
- Policy: Never automatically resend an ambiguous physical send. True exactly-once physical LINE delivery is not guaranteed.

--------------------------------------------------
COMPLETION STATE (AFTER IMPLEMENTATION)
--------------------------------------------------

P2-WP002: READY_FOR_CHATGPT_REVIEW
P2-WP001: CLOSED / PASS
P2-WP001-R1: CLOSED / PASS
PHASE_2: IN PROGRESS
ACTIVE_WORK_PACKAGE: P2-WP002
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_REVIEW

Worker: 28.16 | Required Worker: 28.16 | Runtime Contract: 2
Commit: `feat: add campaign preview and safe template reuse`
