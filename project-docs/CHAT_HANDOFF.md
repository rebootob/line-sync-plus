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
  - *Notes*: Lease infrastructure implemented; R1/R2/R3 correctives implemented; awaiting independent review
* **REL-WP002-R1 — Lease Loss Semantics + Atomic Finalization + Retry + Stop Fencing**: `CORRECTED / SUPERSEDED BY R2-R3`
* **REL-WP002-R2 — Serialize Lease Finalization and Circuit Breaker Stop**: `CORRECTIVE REQUIRED / NOT PASS`
* **REL-WP002-R3 — Complete R2 Corrective Exactly**: `READY_FOR_CHATGPT_REVIEW`
* **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `CLOSED / PASS`
  - **SAFE-WP001-R1**: `CLOSED / PASS`
  - **SAFE-WP001-R2**: `CLOSED / PASS`
  - **SAFE-WP001-R3**: `CLOSED / PASS`
* **SYNC-WP001 — LINE OA Customer Directory Sync to DB**: `CLOSED / PASS`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.15`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.15`

## Implementation Overview (REL-WP002-R3)

- **Removed Recent-Failed Stop Bypass**: `/campaign/stop` with `jobId` strictly requires an active `processing` lease (`status = processing`, matching botId, leaseToken, leaseOwner, and `leaseExpiresAt > now`). No historical or recently-failed bypass is permitted.
- **Pessimistic Locking**: `markSuccess`, `markFail`, and `/campaign/stop` lock the `Campaign` row (and calling `CampaignJob` in stop) using `pessimistic_write` inside TypeORM transactions.
- **Integrated Circuit Breaker inside markFail**: When `consecutiveErrorCount >= 10`, the worker does not call `/campaign/stop`. Instead, it calls `POST /campaign/fail` with `errorOverflow: true`. The backend increments `failedCount`, sets `campaign.status = 'stopped_error'`, clears remaining job leases, and commits atomically.
- **Customer DB Rollback**: In `markFail`, database errors when saving blocked customers propagate out of the transaction to cause a full rollback.
- **Post-Commit Telegram**: Telegram notifications are dispatched only after transaction commit.
- **Same-Job Finalization Retry**: Transient network failure retries finalization preserving `errorOverflow` without physical send re-execution.
- **Test Suite**: 236/236 Jest unit tests passing cleanly (`npm test`). Build passing cleanly (`npm run build`). JS syntax clean (`node --check run/LineSyncApp.js`).

## Exact Recommended Next Step

Awaiting ChatGPT independent review of `REL-WP002-R3`. Do NOT perform Live LINE UAT. Do NOT start REL-WP003.
