# EXECUTION GATE

CONTROL_VERSION: 15

TASK_ID:
P2-WP003

AUTHORIZATION_REVISION:
P2-WP003-AUTH-R2

TITLE:
Scheduled Queue Controls V2

STATUS:
READY_FOR_CHATGPT_REVIEW

CODE_BASELINE_HEAD:
ef5d5b47e33e1e63648dd33dde40c35a638c2de2

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
P2-WP002: CLOSED / PASS
P2-WP002-R1: SUPERSEDED_BY_R2
P2-WP002-R2: CLOSED / PASS
P2-WP002-CLOSE: CLOSED_PASS
P2-WP003: READY_FOR_CHATGPT_REVIEW
ACTIVE_WORK_PACKAGE: P2-WP003
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_REVIEW

--------------------------------------------------
OBJECTIVE — PRESERVE EXISTING SYSTEM
--------------------------------------------------

Harden the EXISTING Scheduled Campaign control surface for P2-WP003 (Scheduled Queue Controls V2).

Authorized Objectives:
1. Operator Stop OA fencing (require botId matching activeBotId; HTTP 400 if missing/invalid, HTTP 409 if active-OA mismatch; scoped lookup by campaignId + botId).
2. Preserve Worker-Driven Stop contract (when body.jobId is present, preserve active job lease fencing, pessimistic locks, stopped_limit/error, and worker lease checks untouched).
3. State-Safe Operator Stop (accept stop only for scheduled, paused, pending, processing => stopped_user; reject completed, failed, stopped_*, paused_reconcile without mutation).
4. Scheduled List OA Isolation & Safe DTO (GET /api/campaigns/scheduled?botId=... fenced to active OA, returning safe DTO with id, name, messageType, status, scheduledAt, target/success/failed counts, timestamps; exclude message bodies, images, URLs, user IDs, tokens, leases, secrets).
5. Stale Scheduled-List Response Fencing (monotonic request generation and captured botId in openScheduledModal(); stale/old responses return with zero UI mutation and zero error display).
6. Reschedule Local Time Correctness (fix ISO <-> local wall-clock datetime conversion helpers for reschedule input without UTC string slicing; use browser local timezone semantics).
7. Safe Scheduled DOM Rendering (build Scheduled UI rows using document.createElement, textContent, addEventListener; zero innerHTML interpolation of user/backend data).
8. Truthful Action Failure Behavior (treat HTTP !ok or data.success !== true as failure, show backend error message, do not display success, refresh Scheduled list if open).
9. Preserve Existing State Transitions (pause => paused; resume => scheduled if future, pending if due/past; reschedule => allowed only for scheduled/paused with valid future datetime).
10. Permanent Security & Safety Invariants (wrong-recipient fencing, recipient verification, OA isolation, single-worker lock, SAFE protection, durable lease, heartbeat, pre-send renewal, ARM/CONFIRM ledger, reconciliation fencing, ambiguous-send quarantine).

--------------------------------------------------
MANDATORY TEST & ACCEPTANCE CONTRACT
--------------------------------------------------

Existing accepted baseline: 447/447 PASS (0 failures, LOCAL REPORTED).
Add focused P2-WP003 coverage proving at least these 32 scenarios:

BACKEND
1. Operator stop missing botId fails closed.
2. Operator stop invalid botId fails closed.
3. Operator stop active-OA mismatch fails closed.
4. Cross-OA campaign cannot be operator-stopped.
5. scheduled -> stopped_user succeeds.
6. paused -> stopped_user succeeds.
7. pending -> stopped_user succeeds.
8. processing -> stopped_user succeeds using existing safe cleanup.
9. completed operator stop rejected.
10. failed operator stop rejected.
11. stopped_user/stopped_limit/stopped_error operator stop rejected.
12. paused_reconcile operator stop rejected.
13. Valid Worker-driven stop contract remains accepted.
14. Stale/invalid Worker lease remains rejected.
15. Scheduled list remains active-OA scoped.
16. Scheduled DTO excludes authored/private/safety-sensitive fields.
17. Existing Pause transition remains intact.
18. Resume + future scheduledAt -> scheduled.
19. Resume + due/past scheduledAt -> pending.
20. Reschedule remains restricted to scheduled/paused + future time.

FRONTEND / CONTROL FLOW
21. stopCampaignControl sends current botId.
22. Scheduled loader captures botId + request generation.
23. Stale Scheduled success response cannot render.
24. Stale Scheduled failure cannot clear/replace newer OA state.
25. Current Scheduled failure displays truthful error.
26. User-controlled Scheduled values use safe DOM/textContent.
27. Dynamic Scheduled action buttons use addEventListener, not interpolated inline onclick.
28. ISO -> local datetime conversion is timezone-correct.
29. Local datetime -> ISO conversion round-trips correctly.
30. Invalid reschedule local datetime is rejected client-side.
31. Pause/Resume/Reschedule/Stop HTTP failure cannot display success.
32. Failed control action refreshes Scheduled UI when modal is open.

--------------------------------------------------
TEST QUALITY REQUIREMENT
--------------------------------------------------

1. Preserve ALL existing tests.
2. The 32 mandatory scenarios present in this gate are minimum acceptance coverage, not merely documentation checks.
3. Race / stale-response tests must prove actual control-flow behavior: an obsolete response must be unable to mutate current/newer UI state.
4. OA fencing tests must prove actual lookup/mutation authority, not just coexisting strings in source.
5. State-transition tests must verify resulting campaign state and no-mutation behavior for rejected transitions.
6. Safe DOM tests must meaningfully prove dynamic Scheduled values are not interpolated into executable HTML or inline onclick handlers.
7. HTTP failure tests must prove success UI is not displayed after !res.ok or data.success !== true.
8. Do NOT satisfy safety/race requirements only with unrelated string-presence or source-order assertions.
9. Existing extracted/static tests may be used where appropriate, but behavior-critical requirements must have meaningful control-flow assertions.
10. No new dependency is authorized. If another dependency or source file becomes necessary: STOP and report. Do NOT expand scope.

--------------------------------------------------
MANDATORY IMPLEMENTATION VERIFICATION
--------------------------------------------------

After P2-WP003 implementation, Antigravity MUST run:
- npm test -- --runInBand
- npm run build
- git diff --check

All three must PASS before marking the task READY_FOR_CHATGPT_REVIEW.

For Jest:
- Record the ACTUAL test count produced by the command.
- Record ACTUAL failure count.
- DO NOT infer final count from 447 + 32.
- DO NOT reuse a stale count.
- DO NOT round or estimate the result (e.g. "Expected approximately 479 tests" is forbidden).

--------------------------------------------------
VERIFICATION FAILURE RULE
--------------------------------------------------

If ANY of the following fails:
- focused required coverage
- full npm test
- npm run build
- git diff --check
- authorized-file scope validation

then:
DO NOT mark READY_FOR_CHATGPT_REVIEW.

Set truthful state:
P2-WP003: BLOCKED / VERIFICATION_FAILED
STATUS: BLOCKED

Record the failed command/check and concise evidence.
Do not silently repair outside authorized scope. Do not start another task.

--------------------------------------------------
EVIDENCE CLASSIFICATION
--------------------------------------------------

Default evidence classification: LOCAL REPORTED.
Only claim independent GitHub CI/check evidence if such a GitHub check/workflow actually exists for the implementation commit. Do NOT convert local output into "CI PASS".

Record separately:
- focused test evidence if run
- full Jest result
- build result
- diff-check result
- GitHub CI/check status if independently present
- zero Live LINE sends

--------------------------------------------------
EXPECTED IMPLEMENTATION COMMIT
--------------------------------------------------

feat: harden scheduled queue controls

The implementation commit may modify ONLY:
- src/app.controller.ts
- src/app.controller.spec.ts
- index.html
plus the authorized five supporting control documents for post-implementation evidence/status synchronization.

--------------------------------------------------
EXPECTED POST-IMPLEMENTATION STATE
--------------------------------------------------

If implementation and all verification pass:

P2-WP003: READY_FOR_CHATGPT_REVIEW
ACTIVE_WORK_PACKAGE: P2-WP003
STATUS: READY_FOR_CHATGPT_REVIEW
PHASE_2: IN PROGRESS
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_REVIEW

Worker: 28.16 | Required Worker: 28.16 | Runtime Contract: 2

Evidence must include:
- ACTUAL Jest test count
- 0 failures
- npm run build PASS
- git diff --check PASS
- evidence classification
- zero Live LINE sends

Do NOT:
- mark P2-WP003 CLOSED/PASS
- close Phase 2
- start another work package
- authorize Phase 3
- perform Live LINE send UAT

Final acceptance remains ChatGPT / Project Owner authority.

--------------------------------------------------
AUTHORIZED IMPLEMENTATION FILES
--------------------------------------------------

ONLY:
- src/app.controller.ts
- src/app.controller.spec.ts
- index.html

After implementation, supporting synchronization is allowed ONLY in:
- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md

--------------------------------------------------
PROHIBITED
--------------------------------------------------

DO NOT modify:
- run/**
- LineSyncApp.js
- Worker version (remains 28.16)
- src/runtime-version.ts (Required Worker 28.16, Runtime Contract 2)
- entities/**
- DB schema / migrations
- package*.json
- ARM / CONFIRM protocol
- send-part ledger
- lease/heartbeat protocol
- recipient verification
- reconciliation resolution contract
- Telegram
- analytics
- customer sync/group logic
- unrelated dashboard UI
- Phase 3, 4, 5
- any non-authorized file

--------------------------------------------------
VERIFICATION & SAFETY
--------------------------------------------------

NO LIVE LINE SEND UAT.
Master Bot remains PAUSED. Zero physical LINE sends.

Worker: 28.16 | Required Worker: 28.16 | Runtime Contract: 2
