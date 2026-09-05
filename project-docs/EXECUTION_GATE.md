# EXECUTION GATE

CONTROL_VERSION: 17

TASK_ID:
P2-WP003-R1

PARENT_TASK:
P2-WP003

AUTHORIZATION_REVISION:
P2-WP003-R1-AUTH-FIX

TITLE:
Operator Stop Semantics + Scheduled Race & Validation Corrective

STATUS:
READY_FOR_CHATGPT_REVIEW

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
P2-WP003: PENDING_CORRECTIVE_ACCEPTANCE
P2-WP003-R1: READY_FOR_CHATGPT_REVIEW
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
LAST ACCEPTED VERIFIED AUTOMATED BASELINE
--------------------------------------------------

LAST ACCEPTED VERIFIED AUTOMATED BASELINE:
447/447 PASS
0 failures
Evidence: LOCAL REPORTED

P2-WP003 implementation HEAD:
119138f6dc27145755e543da4797687358d0f035

That implementation added 32 P2-WP003 scenarios, but its ACTUAL final full Jest count was NOT independently accepted during ChatGPT review.

Therefore:
- DO NOT state 479/479 as an accepted baseline.
- DO NOT infer 447 + 32.
- DO NOT estimate the corrective final count.
- P2-WP003-R1 implementation MUST obtain and report the ACTUAL full Jest count from a new: npm test -- --runInBand

Preserve all original 32 P2-WP003 acceptance scenarios and all R1-01 through R1-20 corrective scenarios.

--------------------------------------------------
MANDATORY TEST & ACCEPTANCE CONTRACT
--------------------------------------------------

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
TEST QUALITY CONTRACT
--------------------------------------------------

1. Race/safety behavior must be proven through meaningful control-flow tests.
2. Do NOT satisfy behavior-critical requirements only by checking string presence/source ordering.
3. Required behavioral areas include:
   - A -> B -> A stale Scheduled response
   - operator stop authority
   - strict local datetime validation
   - HTTP failure handling
   - Scheduled UI refresh behavior
4. Tests for actual index.html functions must execute the ACTUAL implementation where required by R1 scenarios.
5. Do not duplicate helper implementation inside tests and then test the copied implementation.
6. No new dependency is authorized. If another dependency or unauthorized file becomes necessary: STOP and report.

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

Evidence classification remains: LOCAL REPORTED unless independent GitHub CI/check/workflow evidence actually exists.

--------------------------------------------------
VERIFICATION FAILURE EXIT
--------------------------------------------------

If focused corrective coverage, full Jest, build, diff-check, or authorized-file validation fails:

DO NOT mark READY_FOR_CHATGPT_REVIEW.

Use truthful state:
P2-WP003: CORRECTIVE_REQUIRED
P2-WP003-R1: BLOCKED / VERIFICATION_FAILED
ACTIVE_WORK_PACKAGE: P2-WP003-R1
STATUS: BLOCKED

Do not start another task.

--------------------------------------------------
EXPECTED CORRECTIVE IMPLEMENTATION COMMIT
--------------------------------------------------

fix: close P2-WP003 scheduled control review blockers

Authorized corrective source files remain ONLY:
- src/app.controller.ts
- src/app.controller.spec.ts
- index.html

Post-implementation evidence/status synchronization remains allowed ONLY in the five existing control docs.

Do not expand source scope.

--------------------------------------------------
EXPECTED POST-IMPLEMENTATION STATE
--------------------------------------------------

If P2-WP003-R1 implementation and all verification pass:

P2-WP003: PENDING_CORRECTIVE_ACCEPTANCE
P2-WP003-R1: READY_FOR_CHATGPT_REVIEW
ACTIVE_WORK_PACKAGE: P2-WP003-R1
STATUS: READY_FOR_CHATGPT_REVIEW
PHASE_2: IN PROGRESS
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_CORRECTIVE_REVIEW

Worker: 28.16 | Required Worker: 28.16 | Runtime Contract: 2

ACTUAL VERIFIED AUTOMATED RESULTS (P2-WP003-R1):
- Full Jest Test Suite: 499/499 PASS
- Failures: 0
- Command: npm test -- --runInBand
- Build: npm run build PASS (0 errors)
- Diff Check: git diff --check PASS (0 errors)
- Evidence Classification: LOCAL REPORTED
- Live LINE Sends: 0 (Master Bot PAUSED)

DO NOT:
- mark P2-WP003 CLOSED/PASS
- mark P2-WP003-R1 CLOSED/PASS
- close Phase 2
- start P2-WP004 or any next work package
- start Phase 3+
- perform Live LINE send UAT
- test Telegram

Final acceptance remains ChatGPT / Project Owner authority.

--------------------------------------------------
VERIFICATION & SAFETY
--------------------------------------------------

NO LIVE LINE SEND UAT.
Master Bot remains PAUSED. Zero physical LINE sends.

Worker: 28.16 | Required Worker: 28.16 | Runtime Contract: 2
