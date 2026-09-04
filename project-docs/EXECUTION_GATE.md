# EXECUTION GATE

CONTROL_VERSION: 10

TASK_ID:
P2-WP002-R2

TITLE:
Non-Destructive Stale Response Discard

STATUS:
CORRECTIVE_AUTHORIZED

CODE_BASELINE_HEAD:
819dc422ef7e41d322eca93ff5a8daf3adf5ecab

PARENT_TASK:
P2-WP002

PREVIOUS_CORRECTIVE:
P2-WP002-R1

PARENT_TASK_STATUS:
CORRECTIVE_REQUIRED

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
P2-WP002: CORRECTIVE_REQUIRED
P2-WP002-R1: CORRECTIVE_REQUIRED / SUPERSEDED_BY_R2
P2-WP002-R2: CORRECTIVE_AUTHORIZED
ACTIVE_WORK_PACKAGE: P2-WP002-R2
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_CORRECTIVE_REVIEW

--------------------------------------------------
OBJECTIVE
--------------------------------------------------

Corrective P2-WP002-R2 addresses two remaining frontend race/fencing defects identified during independent ChatGPT review of P2-WP002-R1 at HEAD 819dc422ef7e41d322eca93ff5a8daf3adf5ecab:
1. Destructive stale preview response handling (stale preview response calling invalidateCampaignPreview() and destroying a newer active preview).
2. Destructive stale template response/error handling (stale template request/error calling clearCampaignTemplateState() and erasing active templates).

--------------------------------------------------
ACCEPTED R1 WORK — DO NOT REOPEN
--------------------------------------------------

The following R1 changes are accepted and must remain:
- requestSnapshot captured before preview fetch
- previewRequestGeneration exists
- templateRequestGeneration exists
- successful preview stores requestSnapshot
- OA identity comparison exists
- clearCampaignTemplateState() exists
- template UI uses safe DOM / textContent
- OA switch clears template state
- existing submit snapshot fence remains
- backend P2-WP002 remains untouched

--------------------------------------------------
AUTHORIZED IMPLEMENTATION FILES
--------------------------------------------------

ONLY:
- index.html
- src/app.controller.spec.ts

Supporting control docs after implementation:
- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md

--------------------------------------------------
PROHIBITED
--------------------------------------------------

DO NOT modify:
- src/app.controller.ts
- any backend endpoint
- run/**
- LineSyncApp.js
- Worker version (remains 28.16)
- src/runtime-version.ts (Required Worker 28.16, Runtime Contract 2)
- entities/**
- DB schema / migrations
- package*.json
- new npm dependencies
- ARM / CONFIRM
- send ledger
- lease / heartbeat
- reconciliation
- LINE physical send logic
- Telegram
- P2-WP003
- unrelated dashboard areas

--------------------------------------------------
BLOCKER 1: STALE PREVIEW RESPONSE MUST BE NON-DESTRUCTIVE
--------------------------------------------------

An async preview response that is stale (due to generation mismatch, OA change, or authoring snapshot mismatch) MUST return immediately with ZERO mutation of current preview state or UI.
Specifically, it MUST NOT:
- call invalidateCampaignPreview()
- increment generation
- clear currentPreviewSnapshot
- disable a newer valid Confirm button
- clear newer Preview UI
- show an error alert belonging to an obsolete request

Only after proving that the response belongs to the CURRENT request may current-request API failure invalidate/report failure.

Preview Error Ordering:
1. fetch response
2. parse response safely
3. determine whether this request is still current
4. if stale -> return with ZERO UI/global-state mutation
5. if current but API failed -> invalidate current preview + show error
6. if current and success -> render and set requestSnapshot

--------------------------------------------------
BLOCKER 2: STALE TEMPLATE FAILURE MUST BE NON-DESTRUCTIVE
--------------------------------------------------

After template fetch returns, BEFORE ANY UI/cache mutation caused by that response:
verify:
- reqBotId === currentActiveBotId
- reqGen === templateRequestGeneration

If not:
RETURN with zero mutation.

This guard applies to:
- success responses
- HTTP error responses
- malformed response data
- JSON parse errors where request identity can still be evaluated
- catch/error handling

Only the CURRENT template request may clear campaignTemplates, reset dropdown, display returned templates, replace options, or react to HTTP failure. A stale template request must never clear or alter currently displayed templates.

--------------------------------------------------
BEHAVIORAL TEST REQUIREMENTS
--------------------------------------------------

Add focused control-flow tests in src/app.controller.spec.ts:
1. stale Preview branch returns BEFORE invalidateCampaignPreview()
2. stale Preview response cannot clear currentPreviewSnapshot
3. stale Preview response cannot disable Confirm belonging to newer Preview
4. A/B out-of-order Preview: B accepted, then A stale -> B state remains authoritative
5. current Preview API failure still invalidates current Preview
6. current Preview API failure still shows error
7. Preview API failure logic is reachable after current-request validation
8. stale template response checks generation/OA before !res.ok mutation
9. stale template HTTP 500 cannot call clearCampaignTemplateState()
10. OA-A stale failure cannot erase OA-B templates
11. older same-OA request failure cannot erase newer same-OA success
12. current template HTTP failure still clears current template state
13. stale template catch/error branch performs zero mutation
14. current template catch/error branch clears safely
15. successful current template response still renders safe DOM
16. existing submit snapshot fence remains
17. existing template selection invalidation remains

--------------------------------------------------
VERIFICATION & UAT
--------------------------------------------------

Execution run must execute:
- npm test -- --runInBand
- npm run build
- git diff --check

NO LIVE LINE SEND UAT.
Master Bot remains PAUSED. Zero physical LINE sends.

Worker: 28.16 | Required Worker: 28.16 | Runtime Contract: 2

Expected implementation commit:
fix: discard stale campaign responses non-destructively
