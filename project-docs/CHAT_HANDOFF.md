# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 07ac293a08d2c412890d3d20dde486e65e4177b7
* Working Tree: Clean (SAFE-WP001-R3 READY FOR CHATGPT REVIEW)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.12) running inside `chat.line.biz`.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status

* **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `NOT CLOSED / R3 READY_FOR_CHATGPT_REVIEW`
* **SYNC-WP001 — LINE OA Customer Directory Sync to DB**: `CLOSED / PASS`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.12`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.12`

## Implementation Overview (SAFE-WP001-R3)

- **Live UAT Baseline Evidence (v28.11)**: 2-recipient test campaign created while PAUSED processed 2 jobs to completion with verified recipient/OA fencing and no protection errors. However, returning to Dashboard showed `unknown` for all telemetry values because backend telemetry expires after 30s and idle workers did not publish heartbeats.
- **Active Worker Telemetry Heartbeat (`run/LineSyncApp.js` v28.12)**: `processQueue()` polling loop publishes telemetry heartbeat (`publishAccountProtectionTelemetry(validBotId, 0)`) on ~4s cadence after verifying leadership, runtime compatibility, and OA alignment.
- **Strict Observability Only**: Heartbeat does NOT create send reservations, mutate timestamps, claim jobs, or clear cooldowns.
- **Test Suite**: 139/139 Jest unit tests passing cleanly (`npm test`). Build passing cleanly (`npm run build`). JS syntax clean (`node --check run/LineSyncApp.js`).

## Exact Recommended Next Step

Await ChatGPT Control Plane review of `SAFE-WP001-R3`. Await explicit Project Owner authorization before starting `REL-WP002 — Job Lease + Heartbeat`. Do NOT start automatically.
