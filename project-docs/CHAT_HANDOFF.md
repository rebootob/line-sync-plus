# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* Working Tree: Clean (REL-WP002 READY_FOR_CHATGPT_REVIEW)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.13) running inside `chat.line.biz`.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status

* **REL-WP002 — Durable Job Lease + Heartbeat + Stale Worker Fencing**: `READY_FOR_CHATGPT_REVIEW`
* **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `CLOSED / PASS`
  - **SAFE-WP001-R1**: `CLOSED / PASS`
  - **SAFE-WP001-R2**: `CLOSED / PASS`
  - **SAFE-WP001-R3**: `CLOSED / PASS`
* **SYNC-WP001 — LINE OA Customer Directory Sync to DB**: `CLOSED / PASS`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.13`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.13`

## Implementation Overview (REL-WP002)

- **Database Lease Schema**: Added `leaseToken`, `leaseOwner`, `leaseExpiresAt`, `leaseHeartbeatAt` to `CampaignJob` entity and database init with index `(botId, status, leaseExpiresAt)`.
- **Atomic Job Claim & Heartbeat**: Implemented atomic claim logic in `GET /api/campaign/next` generating UUID `leaseToken` and setting 60s lease expiry. Implemented `POST /api/campaign/heartbeat` extending valid leases by 60s or returning 409 Conflict `lease_lost`.
- **Fenced Actions & Finalization**: Added pre-send lease renewal fencing (`renewJobLeaseOrThrow`) before image confirm, text send click, and Enter keydown. Updated `/campaign/success`, `/campaign/fail`, and `/campaign/stop` to validate active leases atomically.
- **Worker Session & Header**: Updated fetchAPI to send `X-LineSync-Worker-Instance` header with `getTabSessionId()`. Worker heartbeats active job every 10s.
- **Test Suite**: 176/176 Jest unit tests passing cleanly (`npm test`). Build passing cleanly (`npm run build`). JS syntax clean (`node --check run/LineSyncApp.js`).

## Exact Recommended Next Step

Awaiting ChatGPT independent review of `REL-WP002`. Do NOT perform Live LINE UAT. Do NOT start REL-WP003.
