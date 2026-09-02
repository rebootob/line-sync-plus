# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 6588270c1d9bd3cc818d6b3784584fb25888c309
* Working Tree: Clean (SAFE-WP001 READY FOR CHATGPT REVIEW)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.9) running inside `chat.line.biz`.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status

* **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `READY_FOR_CHATGPT_REVIEW`
* **SYNC-WP001 — LINE OA Customer Directory Sync to DB**: `CLOSED / PASS`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.9`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.9`

## Implementation Overview (SAFE-WP001)

- Centralized per-OA protection gate (`enforceAccountProtectionGate`) before image confirm send click and text send click / Enter key fallback.
- Per-OA `localStorage` protection key `linesync_account_protection_v1_<botId>`. Internal defaults: `MIN_SEND_GAP_MS = 10000`, `MAX_SEND_ACTIONS_10_MIN = 60`, `MAX_SEND_ACTIONS_1_HOUR = 300`.
- Campaign target hygiene in `POST /api/campaign/add`: deduplicates target IDs, excludes blocked customers (`isBlocked === true`), sets `Campaign.totalTargets` to `queuedCount`, returns hygiene statistics.
- Adaptive system-error backoff schedule (30s / 60s / 120s / max 300s).
- Compact protection status indicator in Dashboard (`accountProtectionBadge`).
- 106/106 Jest unit tests passing cleanly (`npm test`). Build passing cleanly (`npm run build`). JS syntax clean (`node --check run/LineSyncApp.js`).

> ⚠️ **Compliance Notice**: SAFE-WP001 is an operational risk-reduction control. It does NOT guarantee that LINE will never restrict/suspend an OA. Internal rate thresholds are safety defaults, not official LINE API limits. Zero detection evasion techniques are included.

## Exact Recommended Next Step

Await ChatGPT Control Plane review of `SAFE-WP001`. Await explicit Project Owner authorization before starting `REL-WP002 — Job Lease + Heartbeat`. Do NOT start automatically.
