# ACTIVE TASK

```yaml
CONTROL_VERSION: 31
ACTIVE_WORK_PACKAGE: P3-WP002-R2
TASK_ID: P3-WP002-R2
PARENT_TASK: P3-WP002-R1
AUTHORIZATION_REVISION: P3-WP002-R2-EVIDENCE-CLOSURE
TITLE: P3-WP002-R2 — TEST-ONLY + CONTROL-DOC Evidence Closure
STATUS: CORRECTIVE_AUTHORIZED
AUTHORIZED_BY: Project Owner (P3-WP002-R2 Evidence Closure)
AUTHORIZE_EXECUTION: TRUE
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_EXECUTION
PHASE_0: CLOSED / PASS
PHASE_1: CLOSED / PASS
PHASE_2: CLOSED / PASS
PHASE_2_TITLE: Campaign Builder v2
PHASE-2-CLOSE: CLOSED_PASS
PHASE_3: IN PROGRESS
PHASE_3_TITLE: Audience & Customer Intelligence
P3-WP001: CLOSED / PASS
P3-WP001-R1: CORRECTED / SUPERSEDED_BY_C1
P3-WP001-R1-C1: CLOSED_PASS
P3-WP001-CLOSE: CLOSED_PASS
P3-WP001-CLOSE-C1: CLOSED_PASS
P3-WP002-PRE1: COMPLETE / DEFINITION READY
P3-WP002: CORRECTIVE REQUIRED / R2 AUTHORIZED
P3-WP002-R1: CORRECTIVE REQUIRED / SUPERSEDED_BY_R2
P3-WP002-R2: CORRECTIVE_AUTHORIZED
P3-WP003: FUTURE / NOT AUTHORIZED
P3-WP002_BASELINE_HEAD: 7ca0a0dcde5896f18a8254f4a94a74a776d7a36e
P3-WP002_ORIGINAL_IMPLEMENTATION_HEAD: 956e576ffee2f194ce6e617531a58f336de2b280
P3-WP002_INITIAL_REVIEW_HEAD: 80a9f2dcafdb81e84f990e5593009091ab83bb4e
P3-WP002-R1_IMPLEMENTATION_HEAD: 03dd35a5d6b29c6394f93f16061bfaddb5f10174
P3-WP002-R1_REVIEW_READY_HEAD: 9b2a110dfe4f04302a4b6b60bdbc48dfde274009
CODE_BASELINE_HEAD: 03dd35a5d6b29c6394f93f16061bfaddb5f10174
IMPLEMENTATION_CANDIDATE_HEAD: 03dd35a5d6b29c6394f93f16061bfaddb5f10174
REVIEWED_IMPLEMENTATION_HEAD: 03dd35a5d6b29c6394f93f16061bfaddb5f10174
REVIEW_RESULT: SOURCE_PASS / EVIDENCE_CORRECTIVE_REQUIRED
ACCEPTED_IMPLEMENTATION_HEAD: NONE
WORKER_VERSION: 28.16
REQUIRED_WORKER_VERSION: 28.16
RUNTIME_CONTRACT_VERSION: 2
```

---

## Current Control-Plane Decision

P3-WP002-R1 production source has passed independent source/architecture review.

Accepted review truth:

- **Source / Architecture**: `PASS`
- **DB-side aggregation**: `PASS`
- **Time-window production logic**: `PASS`
- **Safe DOM production logic**: `PASS`
- **Production-code corrective still needed**: `NO`
- **Remaining blocker**: `TEST EVIDENCE + CONTROL DOCUMENT TRUTH ONLY`

Therefore P3-WP002 is not yet accepted/closed. The Owner has authorized **P3-WP002-R2** as a test-only evidence-closure corrective.

## Authorized Scope for the Next Fresh Run

The next fresh execution run may modify only:

- `src/app.controller.spec.ts`
- `project-docs/EXECUTION_GATE.md`
- `project-docs/ACTIVE_TASK.md`
- `project-docs/CHAT_HANDOFF.md`
- `project-docs/CURRENT_STATE.md`
- `project-docs/PROJECT_STATUS_ROADMAP.md`

Production implementation is frozen for R2. The following remain prohibited:

- `src/app.controller.ts`
- `index.html`
- `run/**`
- `src/entities/**`
- `src/customer.entity.ts`
- `src/database-init.service.ts`
- `src/runtime-version.ts`
- `src/telegram.service.ts`
- `package*.json`
- DB/schema/migrations/indexes
- any unrelated file

## Required R2 Evidence

1. malformed botId -> HTTP 400 with zero customer query and zero activity QueryBuilder.
2. no active OA -> HTTP 409 with zero customer query and zero activity query.
3. mismatched OA -> HTTP 409 with zero customer query and zero activity query.
4. Assert actual QueryBuilder SQL expressions for success count, successful sentAt MAX, failed count, reconcile_required count, and deterministic latest order `createdAt DESC, id DESC`.
5. Assert strict `WHERE job.botId = :cleanBotId` and `GROUP BY job.lineUserId`.
6. With at least 3 customers, QueryBuilder exactly once, `getRawMany` exactly once, and no N+1.
7. `campaignJobRepository.find` not used by this customer-activity endpoint.
8. CampaignSendPart read/query not used by this customer-activity endpoint.
9. Customer `createdAt/updatedAt` cannot influence activity metrics and are not exposed in the DTO.
10. Malicious `latestJobStatus` renders as literal text only with zero IMG/SCRIPT/SVG payload nodes.
11. Deterministic 7-day clock proof: exactly now PASS, exactly now-7d PASS, future FAIL, invalid FAIL.
12. Deterministic 30-day clock proof: exactly now PASS, exactly now-30d PASS, future FAIL, invalid FAIL.
13. NEVER_SUCCESS: `successfulJobCount == 0` matches; `successfulJobCount > 0` with null `lastSuccessfulSendAt` does not match.

Preserve regression evidence for blocked-customer checkbox disablement, `selectedUsers` checked behavior, and stale OA response discard.

Tests must execute actual production code. No copied production functions, no `.only`, no `.skip`, and no weakening existing tests.

## Validation Contract — Next Fresh Run

Required:

```text
npm test -- --runInBand
npm run build
git diff --check
```

All must PASS.

Evidence classification is `LOCAL REPORTED`. GitHub CI/status remains `NONE` unless real GitHub evidence exists.

## Current Progress

- Official accepted roadmap progress estimate: **~56%**
- Practical implementation progress estimate: **~61%**

These are planning estimates only, not acceptance evidence.

Current blocking item: **P3-WP002-R2 TEST-ONLY evidence closure**.

## Exact Lifecycle

```text
THIS CONTROL UPDATE
-> COMMIT/PUSH
-> STOP
-> FRESH NEW RUN/CHAT
-> execute P3-WP002-R2 gate only
-> READY_FOR_CHATGPT_REVIEW
-> STOP
-> ChatGPT independent review
```

`P3-WP003` remains **FUTURE / NOT AUTHORIZED** and must not start automatically.

---

## Historical Accepted Work-Package Ledger

The following historical control/evidence remains valid and is not re-opened by R2:

- `P3-WP001 — Customer Intelligence Foundation`: `CLOSED / PASS`; accepted implementation HEAD `f9a097a7579c1a357506816656b10c01f68be6ac`.
- `P3-WP001-R1`: `CORRECTED / SUPERSEDED_BY_C1`.
- `P3-WP001-R1-C1`, `P3-WP001-CLOSE`, `P3-WP001-CLOSE-C1`: `CLOSED_PASS`.
- `P2-WP001`, `P2-WP001-R1`, `P2-WP002`, `P2-WP002-R2`, `P2-WP003`, `P2-WP003-R2`: `CLOSED / PASS`.
- `P2-WP002-R1`, `P2-WP003-R1`: superseded by their R2 correctives.
- `P2-WP002-CLOSE`, `P2-WP003-R2-CLOSE`, `P2-WP003-CLOSE`, `PHASE-2-CLOSE`: `CLOSED_PASS`.
- `MON-WP001`, `MON-WP001-R1`, `MON-WP002`, `MON-WP003`: `CLOSED / PASS`.
- `REL-WP001`, `OA-WP001`, `SYNC-WP001`, `SAFE-WP001`, `REL-WP002`, `REL-WP003`: accepted safety/reliability foundation remains closed/pass.

Historical safety evidence remains authoritative: true exactly-once physical LINE delivery is not guaranteed, and ambiguous physical sends must never be automatically resent.
