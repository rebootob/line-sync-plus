# CHAT HANDOFF

## Repository

- Repository: `rebootob/line-sync-plus`
- Canonical Branch: `main`
- Control Update Parent HEAD: `9b2a110dfe4f04302a4b6b60bdbc48dfde274009`
- Current control version: `31`
- Worker Version: `28.16`
- Required Worker Version: `28.16`
- Runtime Contract Version: `2`

## Role Model

- Project Owner = final human authority
- ChatGPT = Control Plane / Project Lead / Architect / Independent Reviewer
- Antigravity = bounded Execution Plane only
- Repository truth is authoritative

## Current Project State

- **PHASE_0**: `CLOSED / PASS`
- **PHASE_1**: `CLOSED / PASS`
- **PHASE_2**: `CLOSED / PASS`
- **PHASE_3**: `IN PROGRESS` — Audience & Customer Intelligence
- **P3-WP001**: `CLOSED / PASS`
- **P3-WP002-PRE1**: `COMPLETE / DEFINITION READY`
- **P3-WP002**: `CORRECTIVE REQUIRED / AWAITING_R2_REVIEW`
- **P3-WP002-R1**: `CORRECTIVE REQUIRED / SUPERSEDED_BY_R2`
- **P3-WP002-R2**: `READY_FOR_CHATGPT_REVIEW`
- **P3-WP003**: `FUTURE / NOT AUTHORIZED`
- **ACTIVE_WORK_PACKAGE**: `P3-WP002-R2`
- **AUTHORIZE_EXECUTION**: `FALSE`
- **NEXT_CANDIDATE**: `NONE`
- **NEXT_CANDIDATE_STATUS**: `AWAITING_REVIEW`

## Latest Accepted Control-Plane Truth

P3-WP002 original implementation:
`956e576ffee2f194ce6e617531a58f336de2b280`

P3-WP002 initial review result:
`CORRECTIVE REQUIRED`

P3-WP002-R1 source corrective implementation:
`03dd35a5d6b29c6394f93f16061bfaddb5f10174`

P3-WP002-R1 independent review result:

- SOURCE / ARCHITECTURE: `PASS`
- DB-SIDE AGGREGATION: `PASS`
- TIME-WINDOW PRODUCTION LOGIC: `PASS`
- SAFE DOM PRODUCTION LOGIC: `PASS`
- PRODUCTION CODE CORRECTIVE STILL NEEDED: `NO`

Remaining issue:
`TEST EVIDENCE + CONTROL DOCUMENT TRUTH ONLY`

P3-WP002 is therefore not yet accepted/closed.

## Head / Review Truth

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

Do not use the future R2 TEST-ONLY commit as an implementation HEAD.

## P3-WP002-R2 Authorized Scope

R2 is test-only evidence closure.

It may modify only:

- `src/app.controller.spec.ts`

and, at completion, the five control documents:

- `project-docs/EXECUTION_GATE.md`
- `project-docs/ACTIVE_TASK.md`
- `project-docs/CHAT_HANDOFF.md`
- `project-docs/CURRENT_STATE.md`
- `project-docs/PROJECT_STATUS_ROADMAP.md`

It must not modify production implementation, including:

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

## Required R2 Evidence Summary

R2 must close all missing evidence for:

- malformed botId fail-fast query-zero behavior
- absent/mismatched active OA fail-fast query-zero behavior
- actual DB QueryBuilder aggregate SQL expressions and strict OA/grouping scope
- exactly one QueryBuilder / one `getRawMany` for at least 3 customers, with no N+1
- no `campaignJobRepository.find`
- no CampaignSendPart reads for this endpoint
- customer timestamps excluded from activity metrics/DTO
- malicious `latestJobStatus` rendered as literal text only
- deterministic 7-day and 30-day boundary/future/invalid clock cases
- strict NEVER_SUCCESS semantics
- preservation of blocked checkbox, selectedUsers checked behavior, and stale OA response discard

Tests must exercise actual production code. No copied production helpers, `.only`, `.skip`, or weakened regression tests.

Required validation in the next fresh run:

```text
npm test -- --runInBand
npm run build
git diff --check
```

All must PASS. Evidence classification is `LOCAL REPORTED`; GitHub CI/status is `NONE` unless real GitHub evidence exists.

## Progress

- Official accepted roadmap progress estimate: **~56%**
- Practical implementation progress estimate: **~61%**

These are planning estimates, not acceptance evidence.

Current blocking item:
**P3-WP002-R2 TEST-ONLY evidence closure**.

## Exact Next Lifecycle

```text
THIS CONTROL UPDATE
-> COMMIT/PUSH
-> STOP
-> FRESH NEW RUN/CHAT
-> fresh-fetch main
-> read AGENT_START_HERE.md
-> read EXECUTION_GATE.md
-> execute P3-WP002-R2 gate only
-> run required validation
-> update control docs to READY_FOR_CHATGPT_REVIEW only if evidence passes
-> COMMIT/PUSH
-> STOP
-> ChatGPT independent review
```

Do not auto-start `P3-WP003`.

## Historical Accepted Foundation

Historical accepted safety and reliability material remains valid:

- `REL-WP001`: single-worker / multi-tab locking — closed/pass.
- `OA-WP001`: OA context isolation and strict identity fencing — closed/pass.
- `SYNC-WP001`: LINE OA directory synchronization — closed/pass.
- `SAFE-WP001`: account-protection/send-compliance guard — closed/pass.
- `REL-WP002`: durable lease/heartbeat/stale-worker fencing — closed/pass.
- `REL-WP003`: durable send-part ledger and ambiguity reconciliation — closed/pass.
- `MON-WP001`, `MON-WP002`, `MON-WP003`: operational monitoring/incident visibility — closed/pass.
- Phase 2 Campaign Builder v2 and its closure packages are closed/pass.
- `P3-WP001` is closed/pass with accepted implementation HEAD `f9a097a7579c1a357506816656b10c01f68be6ac`.

Permanent safety truth:

- True exactly-once physical LINE delivery is **NOT GUARANTEED**.
- Never automatically resend an ambiguous physical send.
- No Worker/schema/LINE-send/Live-UAT/Telegram-test work is authorized by P3-WP002-R2.
