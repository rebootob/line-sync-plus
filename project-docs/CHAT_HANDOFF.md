# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: fed96f1ce97c552066b7de1b7e2d6dd1c83d6591
* Working Tree: Clean (SAFE-WP001 CLOSED / PASS)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.12) running inside `chat.line.biz`.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status

* **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `CLOSED / PASS`
  - **SAFE-WP001-R1**: `CLOSED / PASS`
  - **SAFE-WP001-R2**: `CLOSED / PASS`
  - **SAFE-WP001-R3**: `CLOSED / PASS`
* **SYNC-WP001 — LINE OA Customer Directory Sync to DB**: `CLOSED / PASS`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.12`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.12`

## Implementation & Live UAT Overview (SAFE-WP001)

- **Accepted Live UAT Evidence**:
  - **v28.11 Campaign Send**: 2-recipient test campaign created while Master Bot PAUSED processed 2 jobs to completion. Physical sends verified; zero recipient/OA mismatch; zero protection-state errors.
  - **v28.12 Telemetry Heartbeat**: Dashboard telemetry displayed `Protection: ON`, `10m: 0 / 60`, `1h: 2 / 300`, `Next Send: now`, `Cooling: none`. The 2 send reservations aged out of 10m window while remaining in 1h window. Heartbeat keeps telemetry fresh while idle without creating fake timestamps.
- **Safety Contract Overview**:
  - Per-OA rate limits (10s min gap, 60/10m, 300/1h).
  - Fail-closed protection storage reads & exact read-back timestamp reservations.
  - Final reservation revalidation before physical clicks/keydowns.
  - Target hygiene (blocked exclusion & duplicate target deduplication).
  - Adaptive system-error backoff (30s / 60s / 120s / max 300s).
  - Observational active worker telemetry heartbeat in `processQueue()` (~4s cadence).
- **Test Suite**: 139/139 Jest unit tests passing cleanly (`npm test`). Build passing cleanly (`npm run build`). JS syntax clean (`node --check run/LineSyncApp.js`).

## Exact Recommended Next Step

Await explicit Project Owner authorization before starting `REL-WP002 — Job Lease + Heartbeat`. Do NOT start automatically.
