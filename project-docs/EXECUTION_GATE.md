# EXECUTION GATE

CONTROL_VERSION: 18

TASK_ID:
P2-WP003-R2

PARENT_TASK:
P2-WP003

AUTHORIZATION_REVISION:
P2-WP003-R2-AUTH

TITLE:
Active OA Runtime Fix + Behavioral Proof

STATUS:
CORRECTIVE_AUTHORIZED

CODE_BASELINE_HEAD:
06020bf0adbb072ef067e143f2924e154fc6609c

REVIEWED_IMPLEMENTATION_HEAD:
06020bf0adbb072ef067e143f2924e154fc6609c

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
P2-WP003-R1: SUPERSEDED_BY_R2
P2-WP003-R2: CORRECTIVE_AUTHORIZED
ACTIVE_WORK_PACKAGE: P2-WP003-R2
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_CORRECTIVE_REVIEW

--------------------------------------------------
OBJECTIVE — CORRECTIVE SCOPE (R2)
--------------------------------------------------

Execute P2-WP003-R2 corrective changes resolving 2 specific blockers:

1. BLOCKER 1 — RESTORE ACTIVE OA RUNTIME LOADER:
   - Fix index.html loadOaContextsUI() to consume resActive response payload (`const activeData = await resActive.json();`).
   - Prevent ReferenceError on activeData.
   - Active OA loads normally.
   - If activeBotId changes: update currentActiveBotId and increment scheduledRequestGeneration exactly once.
   - If activeBotId is unchanged: do not increment scheduledRequestGeneration for a simple reload.
   - Context dropdown and badge behavior remain fully functional.

2. BLOCKER 2 — ACTUAL BEHAVIORAL TEST PROOF:
   - Replace source-string presence/substring checks in R1 tests with execution of ACTUAL frontend implementation behavior.
   - Exercise mandatory scenarios R2-01 through R2-14 using Node/VM, mocked fetch, deferred Promises, minimal fake DOM, or direct helper function execution from index.html without code duplication in tests.

3. PRESERVE ACCEPTED WORK:
   - Preserve operator stop semantics (stopped_user for operator stop without jobId).
   - Preserve Worker-driven stop semantics (stopped_limit, stopped_error).
   - Preserve strict local datetime validation (YYYY-MM-DDTHH:mm), leap-year acceptance, and invalid date rejection.
   - Do NOT modify src/app.controller.ts.

Authorized implementation files remain ONLY:
- index.html
- src/app.controller.spec.ts

--------------------------------------------------
LAST ACCEPTED VERIFIED AUTOMATED BASELINE
--------------------------------------------------

PREVIOUS REPORTED BASELINE (P2-WP003-R1):
499/499 PASS
0 failures
Evidence: LOCAL REPORTED

Implementation HEAD:
06020bf0adbb072ef067e143f2924e154fc6609c

Do NOT assume R2 final count. P2-WP003-R2 implementation MUST obtain and report the ACTUAL full Jest count from a new npm test -- --runInBand.

--------------------------------------------------
MANDATORY TEST & ACCEPTANCE CONTRACT (R2)
--------------------------------------------------

Add focused P2-WP003-R2 coverage proving these 14 mandatory behavioral scenarios:

R2-01. Executing ACTUAL loadOaContextsUI() with valid contexts + active responses completes without ReferenceError and consumes resActive.json().
R2-02. When loadOaContextsUI() observes OA-A -> OA-B: currentActiveBotId becomes OA-B and scheduledRequestGeneration advances.
R2-03. Reloading the SAME active OA does not increment scheduledRequestGeneration.
R2-04. Actual switchOaContext() changing OA invalidates previously issued Scheduled request authority.
R2-05. A Scheduled request issued for OA-A, then context changes A -> B -> A, then old OA-A SUCCESS response resolves: old response performs ZERO current Scheduled UI mutation.
R2-06. Same A -> B -> A sequence with stale HTTP failure: ZERO current Scheduled UI mutation and no stale error UI.
R2-07. Same A -> B -> A sequence with stale thrown/network/JSON failure: ZERO current Scheduled UI mutation and no stale error UI.
R2-08. A current/latest Scheduled SUCCESS request still renders normally using the safe DOM implementation.
R2-09. Execute ACTUAL pauseCampaignControl() HTTP/API failure path: must not emit success UI and must refresh Scheduled UI when modal open.
R2-10. Execute ACTUAL resumeCampaignControl() HTTP/API failure path: must not emit success UI and must refresh Scheduled UI when modal open.
R2-11. Execute ACTUAL rescheduleCampaignControl() HTTP/API failure path: must not emit success UI and must refresh Scheduled UI when modal open.
R2-12. Execute ACTUAL stopCampaignControl() HTTP/API failure path: must not emit success UI and must refresh Scheduled UI when modal open.
R2-13. Network/thrown failure for at least one Scheduled control action executes its actual catch path and does not report success.
R2-14. Preserve safe Scheduled rendering: dynamic campaign name/status/backend values remain textContent / safe DOM and are not executable HTML.

--------------------------------------------------
TEST QUALITY CONTRACT
--------------------------------------------------

1. Race/safety behavior must be proven through meaningful control-flow tests.
2. Do NOT satisfy behavior-critical requirements only by checking string presence/source ordering.
3. Tests for actual index.html functions must execute the ACTUAL implementation.
4. Do not duplicate helper implementation inside tests and then test the copied implementation.
5. No new dependency is authorized.

--------------------------------------------------
MANDATORY IMPLEMENTATION VERIFICATION
--------------------------------------------------

After P2-WP003-R2 implementation, Antigravity MUST run:
- npm test -- --runInBand
- npm run build
- git diff --check

All three must PASS before marking the task READY_FOR_CHATGPT_REVIEW.

--------------------------------------------------
VERIFICATION FAILURE EXIT
--------------------------------------------------

If verification fails:
P2-WP003: CORRECTIVE_REQUIRED
P2-WP003-R2: BLOCKED / VERIFICATION_FAILED
ACTIVE_WORK_PACKAGE: P2-WP003-R2
STATUS: BLOCKED

--------------------------------------------------
EXPECTED CORRECTIVE IMPLEMENTATION COMMIT
--------------------------------------------------

fix: restore active OA loader and scheduled behavioral tests

Authorized corrective source files remain ONLY:
- index.html
- src/app.controller.spec.ts

--------------------------------------------------
EXPECTED POST-IMPLEMENTATION STATE
--------------------------------------------------

If P2-WP003-R2 implementation and all verification pass:

P2-WP003: PENDING_CORRECTIVE_ACCEPTANCE
P2-WP003-R1: SUPERSEDED_BY_R2
P2-WP003-R2: READY_FOR_CHATGPT_REVIEW
ACTIVE_WORK_PACKAGE: P2-WP003-R2
STATUS: READY_FOR_CHATGPT_REVIEW
PHASE_2: IN PROGRESS
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_CORRECTIVE_REVIEW

Worker: 28.16 | Required Worker: 28.16 | Runtime Contract: 2

--------------------------------------------------
VERIFICATION & SAFETY
--------------------------------------------------

NO LIVE LINE SEND UAT.
Master Bot remains PAUSED. Zero physical LINE sends.

Worker: 28.16 | Required Worker: 28.16 | Runtime Contract: 2
