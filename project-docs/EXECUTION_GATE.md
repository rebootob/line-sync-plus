# EXECUTION GATE

CONTROL_VERSION: 9

TASK_ID:
P2-WP002-R1

TITLE:
Stale Preview Race & OA Template Cache Fencing

STATUS:
READY_FOR_CHATGPT_REVIEW

CODE_BASELINE_HEAD:
8cbf7d64f9ca13bf73013aea38690541e721a6fb

PARENT_TASK:
P2-WP002

PARENT_TASK_STATUS:
PENDING_CORRECTIVE_ACCEPTANCE

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
P2-WP002: PENDING_CORRECTIVE_ACCEPTANCE
ACTIVE_WORK_PACKAGE: P2-WP002-R1
P2-WP002-R1: READY_FOR_CHATGPT_REVIEW
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_REVIEW

--------------------------------------------------
OBJECTIVE
--------------------------------------------------

Corrective P2-WP002-R1 addresses frontend preview race conditions and OA template cache fencing identified during independent ChatGPT review of P2-WP002 implementation at HEAD 8cbf7d64f9ca13bf73013aea38690541e721a6fb.

Review Results:
- Backend preview contract: PASS
- Safe template DTO: PASS
- Scope / Worker safety: PASS
- Frontend preview consistency: BLOCK
- OA template cache isolation: BLOCK

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

Do NOT change accepted preview payload semantics.
Do NOT change message-type validation contract.

--------------------------------------------------
BLOCKER 1: STALE PREVIEW RESPONSE RACE
--------------------------------------------------

When generateCampaignPreview() begins:
Capture an immutable request snapshot BEFORE fetch (`requestSnapshot = getAuthoringSnapshot()`).
Use request sequencing / request identity (monotonic generation ID / nonce, e.g. `previewRequestGeneration += 1`).

On preview invalidation:
Advance/cancel the current generation or otherwise ensure any outstanding response becomes stale.

After fetch returns successfully, BEFORE rendering or enabling Confirm:
Verify ALL:
1. response belongs to latest preview request generation
2. current authoring snapshot === requestSnapshot
3. active OA is still the OA captured in requestSnapshot/request context
4. preview has not been invalidated since request started

If ANY condition fails:
- discard response
- do not render response
- do not enable Confirm
- do not set currentPreviewSnapshot

On accepted response:
- currentPreviewSnapshot MUST be set to requestSnapshot (NOT getAuthoringSnapshot() evaluated after response).

Multiple preview request race:
Only the newest valid request may render preview, set successful preview snapshot, or enable Confirm Create. Response A returning after response B must NOT overwrite Preview B.

OA change during preview:
If active OA changes while preview request is outstanding, old OA response MUST be ignored.

--------------------------------------------------
BLOCKER 2: OA TEMPLATE CACHE / LATE RESPONSE FENCING
--------------------------------------------------

Create frontend helper `clearCampaignTemplateState()` to safely:
- set `campaignTemplates = []`
- clear templateReuseSelect options
- restore safe default placeholder option
- clear selected template
- never retain previous OA campaign-controlled content

Use safe DOM APIs: replaceChildren(), createElement(), textContent. No campaign-controlled innerHTML.

OA Change Requirement:
On successful OA switch, BEFORE loading data/templates for new OA:
- clear template cache
- clear template selection/options
- invalidate preview
Then load new OA data.

Template Fetch Failure:
At beginning of template load: capture requested OA identity.
If request fails:
- `campaignTemplates = []`
- clear dropdown
- show safe default/manual-create option
- do NOT retain old OA templates
- manual campaign authoring remains usable

Late Template Response Race:
Before applying returned templates verify:
- requested OA still equals currentActiveBotId
- request is still the latest template request
Otherwise discard result.

Template Selection:
Template selection must copy only: messageType, message, imageUrl, linkUrl. Must still invalidate preview.

Submit Fence:
Preserve existing pre-submit fence: current authoring snapshot must equal successful-preview snapshot.

--------------------------------------------------
EXACT REQUIRED TEST SCENARIOS
--------------------------------------------------

Add focused tests in src/app.controller.spec.ts:
1. preview request captures snapshot BEFORE fetch response
2. form edit during in-flight preview causes old response to be discarded
3. stale response cannot re-enable Confirm
4. two preview requests resolving out of order keep only newest result
5. OA switch during in-flight preview discards previous-OA response
6. OA switch clears campaignTemplates
7. OA switch clears/reset template dropdown
8. template fetch failure clears cache and stale options
9. template fetch failure still leaves safe default/manual-create option
10. old OA template response arriving after OA switch is discarded
11. template response applies only when requested OA == currentActiveBotId
12. template request generation prevents older response overwriting newer
13. template DOM still uses textContent / safe DOM
14. template selection still invalidates preview
15. submit still blocks when current state != successful-preview snapshot

Preserve all existing tests.

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
fix: fence stale campaign preview and template responses
