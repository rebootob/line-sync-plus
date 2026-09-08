# LineSync Plus — Project Status, Incident History & Development Roadmap

## 1. Executive Summary

LineSync Plus is an automated LINE Official Account customer-contact synchronization, segmentation, and broadcast campaign management platform built around a NestJS backend, PostgreSQL/TypeORM data layer, single-page dashboard, and Tampermonkey worker running in `chat.line.biz`.

Current roadmap truth:

- **Phase 0**: `CLOSED / PASS`
- **Phase 1**: `CLOSED / PASS`
- **Phase 2**: `CLOSED / PASS`
- **Phase 3**: `IN PROGRESS`
- **Phase 4**: `FUTURE`
- **Phase 5**: `FUTURE`

Current active corrective:
**P3-WP002-R2 — TEST-ONLY + CONTROL-DOC Evidence Closure**.

P3-WP003 remains **FUTURE / NOT AUTHORIZED**.

---

## 2. Current Control Gate

```yaml
CONTROL_VERSION: 31
ACTIVE_WORK_PACKAGE: P3-WP002-R2
TASK_ID: P3-WP002-R2
PARENT_TASK: P3-WP002-R1
AUTHORIZATION_REVISION: P3-WP002-R2-EVIDENCE-CLOSURE
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZE_EXECUTION: FALSE
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_REVIEW
```

P3-WP002-R1 production source has passed independent source/architecture review, but P3-WP002 is not accepted/closed because required regression evidence remains incomplete.

Review result:
`SOURCE_PASS / EVIDENCE_CORRECTIVE_REQUIRED`.

---

## 3. P3-WP002 Head / Review Ledger

- `P3-WP002_BASELINE_HEAD`: `7ca0a0dcde5896f18a8254f4a94a74a776d7a36e`
- `P3-WP002_ORIGINAL_IMPLEMENTATION_HEAD`: `956e576ffee2f194ce6e617531a58f336de2b280`
- `P3-WP002_INITIAL_REVIEW_HEAD`: `80a9f2dcafdb81e84f990e5593009091ab83bb4e`
- `P3-WP002-R1_IMPLEMENTATION_HEAD`: `03dd35a5d6b29c6394f93f16061bfaddb5f10174`
- `P3-WP002-R1_REVIEW_READY_HEAD`: `9b2a110dfe4f04302a4b6b60bdbc48dfde274009`
- `CODE_BASELINE_HEAD`: `03dd35a5d6b29c6394f93f16061bfaddb5f10174`
- `IMPLEMENTATION_CANDIDATE_HEAD`: `03dd35a5d6b29c6394f93f16061bfaddb5f10174`
- `REVIEWED_IMPLEMENTATION_HEAD`: `03dd35a5d6b29c6394f93f16061bfaddb5f10174`
- `REVIEW_RESULT`: `SOURCE_PASS / EVIDENCE_CORRECTIVE_REQUIRED`
- `ACCEPTED_IMPLEMENTATION_HEAD`: `NONE`

The future R2 TEST-ONLY commit must not be recorded as an implementation HEAD.

---

## 4. Current Phase 3 Decision

### P3-WP001 — Customer Intelligence Foundation

Status: **CLOSED / PASS**

Accepted implementation HEAD:
`f9a097a7579c1a357506816656b10c01f68be6ac`

Historical corrective/closure chain:

- `P3-WP001-R1`: `CORRECTED / SUPERSEDED_BY_C1`
- `P3-WP001-R1-C1`: `CLOSED_PASS`
- `P3-WP001-CLOSE`: `CLOSED_PASS`
- `P3-WP001-CLOSE-C1`: `CLOSED_PASS`

### P3-WP002-PRE1 — Activity Intelligence Definition

Status: **COMPLETE / DEFINITION READY**

### P3-WP002 — Outbound Activity Intelligence

Status: **CORRECTIVE REQUIRED / AWAITING_R2_REVIEW**

Historical implementation/review chain:

1. Baseline: `7ca0a0dcde5896f18a8254f4a94a74a776d7a36e`
2. Original implementation: `956e576ffee2f194ce6e617531a58f336de2b280`
3. Initial review: `CORRECTIVE REQUIRED`
4. R1 source corrective: `03dd35a5d6b29c6394f93f16061bfaddb5f10174`
5. R1 independent review:
   - source / architecture PASS
   - DB-side aggregation PASS
   - time-window production logic PASS
   - safe DOM production logic PASS
   - no further production corrective required
6. Remaining gap: regression evidence + current control-document truth
7. R2: **READY_FOR_CHATGPT_REVIEW** for test-only evidence closure

### P3-WP002-R2 — TEST-ONLY + CONTROL-DOC Evidence Closure

Status: **READY_FOR_CHATGPT_REVIEW**

Authorized next-run production impact: **NONE**.

The only implementation-adjacent file authorized is `src/app.controller.spec.ts`.

Required evidence must prove:

- malformed botId and invalid OA contexts fail before customer/activity queries
- actual one-query DB-side aggregate SQL and strict OA/grouping scope
- no N+1, no `campaignJobRepository.find`, and no CampaignSendPart query
- customer timestamps cannot affect or leak into activity DTO semantics
- malicious latest status remains text-only in the DOM
- deterministic 7-day/30-day now/lower-boundary/future/invalid behavior
- strict NEVER_SUCCESS behavior
- prior blocked-checkbox, selectedUsers, and stale-OA-response regressions remain intact

Required next-run validation:

```text
npm test -- --runInBand
npm run build
git diff --check
```

Evidence classification: `LOCAL REPORTED`.
GitHub CI/status: `NONE` unless actual GitHub evidence exists.

### P3-WP003 — Persistent Tags & Advanced Segmentation

Status: **FUTURE / NOT AUTHORIZED**

No automatic start is permitted.

---

## 5. Continuous Phase 0–5 Roadmap

### Phase 0 — Security & Reliability Foundation — CLOSED / PASS

Purpose: establish fail-closed identity, worker, delivery-safety, and secret-hygiene foundations before higher-level product expansion.

Accepted historical work includes:

- `BUG-WP001` / related safety correctives — wrong-recipient and execution safety hardening.
- `BUG-WP002` / R1 — OA context-poisoning protection.
- `SEC-WP001` — secret hygiene; public-repository rules remain mandatory.
- `OPS-WP001` / R1 — runtime version fencing.
- `REL-WP001` / R1 / R2 — single worker / multi-tab lock.
- `OA-WP001` / R1 — OA context isolation & strict identity fencing.
- `SYNC-WP001` / R1..R5 — LINE OA customer-directory synchronization.
- `SAFE-WP001` / R1..R3 — account-protection/send-compliance guard.
- `REL-WP002` and accepted corrective chain — durable job lease, heartbeat, stale-worker fencing, serialized finalization.
- `REL-WP003` and accepted corrective chain — send-part ledger, ambiguity quarantine, queue pre-pass, and operator reconciliation.

Permanent Phase 0 safety truth:

- True exactly-once physical LINE delivery cannot be guaranteed across the LINE Web UI boundary.
- Never automatically resend an ambiguous physical send.
- Wrong-recipient fencing, OA isolation, single-worker fencing, durable leases, account protection, and ambiguity reconciliation must remain intact.

### Phase 1 — Operations & Monitoring — CLOSED / PASS

Accepted work:

- `MON-WP001 — Operational Health & Readiness`: closed/pass.
- `MON-WP001-R1 — Truthful Health State Corrective`: closed/pass.
- `MON-WP002 — Queue / Lease / Reconciliation Monitoring`: closed/pass.
- `MON-WP003 — Alerts / Incident Visibility`: closed/pass.

Historical evidence classification remains local-reported where no GitHub status workflow existed.

Backup / Recovery / Retention was explicitly deferred and was not required for Phase 1 closure.

### Phase 2 — Campaign Builder v2 — CLOSED / PASS

Accepted work:

- `P2-WP001 — Campaign Authoring Contract & OA Isolation`: closed/pass.
- `P2-WP001-R1 — Fail-Closed scheduledAt Type Validation`: closed/pass.
- `P2-WP002 — Authoritative Campaign Preview & Safe Template Reuse V2`: closed/pass.
- `P2-WP002-R1`: superseded by R2.
- `P2-WP002-R2 — Non-Destructive Stale Response Discard`: closed/pass.
- `P2-WP002-CLOSE`: closed/pass.
- `P2-WP003 — Scheduled Queue Controls V2`: closed/pass.
- `P2-WP003-R1`: superseded by R2.
- `P2-WP003-R2 — Active OA Runtime Fix + Behavioral Proof`: closed/pass.
- `P2-WP003-R2-CLOSE`: closed/pass.
- `P2-WP003-CLOSE`: closed/pass.
- `PHASE-2-CLOSE`: closed/pass.

Historical accepted P2-WP002 final code HEAD:
`b6103e9c322ff257dcfda475217186e740e4893a`.

Historical accepted P2-WP003-R2 implementation HEAD:
`23f98b0e7c3fd232d63bc94533da6eae262b32fc`.

### Phase 3 — Audience & Customer Intelligence — IN PROGRESS

Current sequence:

- `P3-WP001`: closed/pass.
- `P3-WP002-PRE1`: definition ready.
- `P3-WP002`: corrective required; R2 authorized.
- `P3-WP002-R1`: superseded by R2 for evidence closure only; its production source remains the reviewed implementation.
- `P3-WP002-R2`: corrective authorized, test-only.
- `P3-WP003`: future / not authorized.

Phase 3 may not advance to P3-WP003 until P3-WP002 evidence is executed, independently reviewed, and explicitly closed/accepted by the Control Plane/Owner lifecycle.

### Phase 4 — Multi-OA, Governance & Admin — FUTURE

Planned direction only; not authorized by the current gate.

Potential future themes:

- stronger multi-OA administration
- role/permission governance
- administrative workflows and policy controls
- operational governance across accounts

No Phase 4 implementation is authorized now.

### Phase 5 — Analytics & Optimization — FUTURE

Planned direction only; not authorized by the current gate.

Potential future themes:

- campaign performance reporting
- delivery throughput and operational metrics
- audience/campaign effectiveness analytics
- optimization and decision-support reporting

No Phase 5 implementation is authorized now.

---

## 6. Historical Accepted Evidence Ledger

The following history remains accepted and is retained as repository truth unless a later explicit review supersedes it:

- OA context isolation accepted on Worker v28.5.
- Customer directory synchronization accepted on Worker v28.8.
- SAFE account-protection send run and telemetry closure accepted on Worker v28.11/v28.12 lineage; current Worker remains v28.16.
- REL-WP002 controlled live evidence demonstrated successful 2-recipient processing with lease/recipient/OA protection and no duplicate physical resend claim.
- REL-WP003 controlled evidence demonstrated durable send-part state, ambiguity quarantine, operator reconciliation, cleanup, and the permanent limitation that physical exactly-once cannot be guaranteed.
- `MON-WP001` accepted review HEAD: `6729bb118e727f9ff3f559c8b4a8efe8c0c9ed38`.
- `MON-WP002` accepted review HEAD: `5b34269397afbd9046610c366d9f0c27bf3d5532`.
- `MON-WP003` accepted review HEAD: `acb1185e1a5ff21c2c346d326669392cacdfa639`.
- Phase 1 closure baseline: `ac1ded4728df14f741104073618dd3623b6d1c25`.
- P3-WP001 accepted implementation HEAD: `f9a097a7579c1a357506816656b10c01f68be6ac`.

These historical records do not authorize new execution by themselves.

---

## 7. Runtime / Safety Contract

- Worker: `28.16`
- Required Worker: `28.16`
- Runtime Contract: `2`

P3-WP002-R2 authorizes:

- test evidence in `src/app.controller.spec.ts`
- completion sync of the five control docs

P3-WP002-R2 does **not** authorize:

- Worker changes
- schema changes
- production controller changes
- dashboard production changes
- LINE sends
- Live UAT
- Telegram tests
- dependency/package changes

---

## 8. Progress Estimate

- Official accepted roadmap progress estimate: **~56%**
- Practical implementation progress estimate: **~61%**

These percentages are planning estimates, not acceptance evidence.

The difference reflects implementation work that is materially present but is not counted as accepted until evidence closure and independent review complete.

---

## 9. Immediate Decision Gate

Current blocking item:
**P3-WP002-R2 TEST-ONLY evidence closure**.

Exact next lifecycle:

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

No work package after P3-WP002-R2 may auto-start.

`P3-WP003` remains **FUTURE / NOT AUTHORIZED**.
