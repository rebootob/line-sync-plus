# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 07b9dc4d951510b90b6716703ec7e0fb2d2fda3b
* Working Tree: Clean (SAFE-WP001-R1 READY FOR CHATGPT REVIEW)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.10) running inside `chat.line.biz`.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status

* **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `NOT CLOSED / R1 READY_FOR_CHATGPT_REVIEW`
* **SYNC-WP001 — LINE OA Customer Directory Sync to DB**: `CLOSED / PASS`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.10`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.10`

## Implementation Overview (SAFE-WP001-R1)

- **Fail-Closed Protection State**: `loadProtectionTimestamps` throws `ACCOUNT_PROTECTION_STATE_UNAVAILABLE` on reading malformed or unavailable `localStorage` state. `recordProtectionSendAction` enforces write + read-back verification before physical send.
- **Truthful Telemetry Subsystem**: Worker publishes non-sensitive observations to `POST /api/account-protection/telemetry`. Dashboard queries `GET /api/account-protection/status?botId=...` and displays `"unknown"` when unavailable/stale instead of fake zero values.
- **Final Send Revalidations**: Revalidates leadership, recipient, OA context, and protection reservation immediately before image confirm click, text send click, and Enter key fallback.
- **Test Suite**: 122/122 Jest unit tests passing cleanly (`npm test`). Build passing cleanly (`npm run build`). JS syntax clean (`node --check run/LineSyncApp.js`).

## Exact Recommended Next Step

Await ChatGPT Control Plane review of `SAFE-WP001-R1`. Await explicit Project Owner authorization before starting `REL-WP002 — Job Lease + Heartbeat`. Do NOT start automatically.
