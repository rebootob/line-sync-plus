# EXECUTION GATE

CONTROL_VERSION: 16

TASK_ID:
P2-WP003-R1

PARENT_TASK:
P2-WP003

TITLE:
Operator Stop Semantics + Scheduled Race & Validation Corrective

STATUS:
CORRECTIVE_AUTHORIZED

CODE_BASELINE_HEAD:
119138f6dc27145755e543da4797687358d0f035

REVIEWED_IMPLEMENTATION_HEAD:
119138f6dc27145755e543da4797687358d0f035

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
P2-WP003: CORRECTIVE_REQUIRED
P2-WP003-R1: CORRECTIVE_AUTHORIZED
ACTIVE_WORK_PACKAGE: P2-WP003-R1
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_CORRECTIVE_REVIEW

--------------------------------------------------
OBJECTIVE — CORRECTIVE SCOPE
--------------------------------------------------

Execute P2-WP003-R1 corrective changes resolving 4 specific blockers:

1. BLOCKER 1 — OPERATOR STOP MUST ALWAYS BE stopped_user:
   - For operator stop (body.jobId absent), after all existing OA fencing/state validation passes, successful operator stop MUST ALWAYS set campaign.status = stopped_user.
   - Operator-supplied flags (limitReached, errorOverflow) MUST NOT grant Worker/circuit-breaker authority or set status to stopped_limit / stopped_error.
   - Preserve Worker-driven stop semantics when body.jobId IS present (stopped_limit, stopped_error).
   - Do not weaken Worker version fencing, OA header fencing, worker instance fencing, leaseToken/leaseOwner, lease expiry, processing-job requirement, pessimistic locking, lease cleanup.

2. BLOCKER 2 — A -> B -> A STALE SCHEDULED RESPONSE FENCING:
   - Every actual OA identity change MUST invalidate all previously-issued Scheduled request authority using a monotonic generation/epoch.
   - Property: Once an OA context change occurs, a Scheduled request issued before that change can NEVER become authoritative again, even if the user switches back to the original OA.
   - Invalidate when currentActiveBotId changes (successful operator OA switch or loadOaContextsUI observing a different activeBotId). Do not invalidate when reloading the same OA value.
   - Stale requests perform ZERO mutation (no table render/clear/error/success/loading-state replacement) across success, HTTP failure, JSON/parse failure, and network/thrown failure.

3. BLOCKER 3 — STRICT LOCAL DATETIME VALIDATION:
   - Fix localDatetimeInputToIso(localStr) to implement strict browser-local wall-clock validation for format YYYY-MM-DDTHH:mm:
     1. Require exact structural format YYYY-MM-DDTHH:mm.
     2. Parse year/month/day/hour/minute components.
     3. Enforce numeric ranges.
     4. Construct browser-local Date.
     5. Compare resulting local date components back to supplied components.
     6. Reject if normalization changed any component (e.g. 2026-02-31T10:00, 2026-13-01T10:00, 2026-09-05T25:00 are rejected; 2028-02-29T10:30 is accepted).
     7. Return canonical ISO string only after strict validation succeeds.
   - Do NOT hard-code UTC+7.

4. BLOCKER 4 — TEST QUALITY & BEHAVIORAL PROOFS:
   - Preserve all 32 original P2-WP003 scenarios and add at least 20 R1 corrective scenarios (R1-01 to R1-20) exercising ACTUAL implementation behavior.
   - Execute ACTUAL helper functions from index.html rather than duplicating implementation logic inside tests.

5. SAFE DOM PRESERVATION:
   - Preserve dynamic Scheduled table safe DOM rendering (createElement, textContent, addEventListener).

--------------------------------------------------
MANDATORY TEST & ACCEPTANCE CONTRACT
--------------------------------------------------

Existing accepted baseline: 479/479 PASS (0 failures, LOCAL REPORTED).
Add focused P2-WP003-R1 coverage proving at least these 20 corrective scenarios (plus 32 original P2-WP003 scenarios):

R1-01. Operator stop with no jobId and limitReached=true still results in stopped_user.
R1-02. Operator stop with no jobId and errorOverflow=true still results in stopped_user.
R1-03. Valid Worker-driven stop semantics remain unchanged.
R1-04. A -> B -> A stale Scheduled SUCCESS response performs zero mutation.
R1-05. A -> B -> A stale Scheduled HTTP failure performs zero mutation.
R1-06. A -> B -> A stale Scheduled thrown/network/parse failure performs zero mutation.
R1-07. A current/latest Scheduled request still renders normally.
R1-08. Changing active OA invalidates prior Scheduled request authority.
R1-09. Reloading the SAME active OA does not incorrectly revive an old request or reset authority backward.
R1-10. 2026-02-31T10:00 is rejected.
R1-11. 2026-13-01T10:00 is rejected.
R1-12. 2026-09-05T25:00 is rejected.
R1-13. Malformed datetime string is rejected.
R1-14. 2028-02-29T10:30 is accepted and converted to ISO using browser-local timezone semantics.
R1-15. ISO -> local -> ISO behavior executes the ACTUAL helper functions, not duplicated test-side implementations.
R1-16. Pause HTTP failure executes failure path and cannot emit success UI.
R1-17. Resume HTTP failure executes failure path and cannot emit success UI.
R1-18. Reschedule HTTP failure executes failure path and cannot emit success UI.
R1-19. Stop HTTP failure executes failure path and cannot emit success UI.
R1-20. Failed Scheduled control action refreshes Scheduled UI when the modal is open.

--------------------------------------------------
MANDATORY IMPLEMENTATION VERIFICATION
--------------------------------------------------

After P2-WP003-R1 implementation, Antigravity MUST run:
- npm test -- --runInBand
- npm run build
- git diff --check

All three must PASS before marking the task READY_FOR_CHATGPT_REVIEW.

For Jest:
- Record ACTUAL test count.
- Record ACTUAL failure count (0).
- DO NOT infer or estimate test counts.

--------------------------------------------------
EXPECTED IMPLEMENTATION COMMIT
--------------------------------------------------

fix: enforce operator stop user status scheduled oa epoch and strict local date validation

Authorized implementation files ONLY:
- src/app.controller.ts
- src/app.controller.spec.ts
- index.html

Supporting control documents for evidence/status sync:
- project-docs/EXECUTION_GATE.md
- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md

--------------------------------------------------
VERIFICATION & SAFETY
--------------------------------------------------

NO LIVE LINE SEND UAT.
Master Bot remains PAUSED. Zero physical LINE sends.

Worker: 28.16 | Required Worker: 28.16 | Runtime Contract: 2
