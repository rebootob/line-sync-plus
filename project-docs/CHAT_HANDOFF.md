# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* Working Tree: Clean (REL-WP002-R1 READY_FOR_CHATGPT_REVIEW)
* Baseline: 928ded4929deef49bd04def3f9ee34aab7b4bd0e

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.14) running inside `chat.line.biz`.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status

* **ACTIVE_WORK_PACKAGE**: `NONE`
* **REL-WP002 — Durable Job Lease + Heartbeat + Stale Worker Fencing**: `NOT CLOSED`
  - *Notes*: Lease infrastructure implemented; R1 & R2 correctives implemented; awaiting independent review
* **REL-WP002-R1 — Lease Loss Semantics + Atomic Finalization + Retry + Stop Fencing**: `CLOSED / PASS`
* **REL-WP002-R2 — Serialize Lease Finalization and Circuit Breaker Stop**: `READY_FOR_CHATGPT_REVIEW`
* **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `CLOSED / PASS`
  - **SAFE-WP001-R1**: `CLOSED / PASS`
  - **SAFE-WP001-R2**: `CLOSED / PASS`
  - **SAFE-WP001-R3**: `CLOSED / PASS`
* **SYNC-WP001 — LINE OA Customer Directory Sync to DB**: `CLOSED / PASS`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.14`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.14`

## Implementation Overview (REL-WP002-R1 & REL-WP002-R2)

- **Lease Error Differentiation**: Added `fetchLeaseAPI` helper in userscript distinguishing `{ state: 'renewed' }`, explicit HTTP 409 `{ state: 'lease_lost' }`, and transient `{ state: 'transient_error' }`.
- **Pre-Send & Heartbeat Semantics**: Heartbeat distinguishes explicit lease loss from transient network errors. Pre-send renewal failure throws `JOB_LEASE_UNCONFIRMED` without failing closed prematurely when lease remains unexpired.
- **Fail-Closed Lease Lost Router**: `JOB_LEASE_LOST` relinquishes local job state without calling `/campaign/fail`, without incrementing system error count, and without triggering cooldown.
- **Same-Job Finalization Retry**: After irreversible physical send, transient finalization network failure retries acknowledgement periodically with identical credentials while lease is valid; physical send is never repeated.
- **Transactional Finalization**: `markSuccess`, `markFail`, and worker-driven `stopCampaign` execute inside TypeORM transactions with atomic fencing queries; duplicate finalizations fail closed with 409 `lease_lost` and cannot double-increment counters or mutate blocked customer state.
- **Fenced Campaign Stop**: Validates Worker version 28.14, OA context header matching body `botId`, strict Worker instance regex (`^ts_[0-9]{10,17}_[a-z0-9]{4,32}$`), and unexpired active lease.
- **Serialized Circuit Breaker Stop (R2)**: Serializes campaign stop authorization and job finalization so that when 10 consecutive errors occur, the worker can safely stop the campaign and finalize the failed job without 409 lease collisions.
- **Image Send Signature**: `confirmAndCloseImageModal(expectedUserId, expectedBotId)` validates botId and active OA context before clicks.
- **Test Suite**: 211/211 Jest unit tests passing cleanly (`npm test`). Build passing cleanly (`npm run build`). JS syntax clean (`node --check run/LineSyncApp.js`).

## Exact Recommended Next Step

Awaiting ChatGPT independent review of `REL-WP002-R2`. Do NOT perform Live LINE UAT. Do NOT start REL-WP003.
