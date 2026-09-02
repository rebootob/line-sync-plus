# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 3bca4d5d215556eb5ee9425d49093556203d2488
* Working Tree: Clean (SAFE-WP001-R2 READY FOR CHATGPT REVIEW)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.11) running inside `chat.line.biz`.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status

* **SAFE-WP001 — LINE OA Account Protection / Send Compliance Guard**: `NOT CLOSED / R2 READY_FOR_CHATGPT_REVIEW`
* **SYNC-WP001 — LINE OA Customer Directory Sync to DB**: `CLOSED / PASS`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.11`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.11`

## Implementation Overview (SAFE-WP001-R2)

- **Strict Protection State Schema**: `loadProtectionTimestamps` enforces finite numeric timestamp members. Malformed members throw `ACCOUNT_PROTECTION_STATE_UNAVAILABLE`. Returns sorted ascending timestamps.
- **Exact Read-Back Timestamp Reservation**: `recordProtectionSendAction` verifies exact length, order, and values upon read-back before returning reservation `{ botId, reservedAt }`.
- **Final Reservation Revalidation**: `verifyProtectionReservation` revalidates newest timestamp in storage immediately before physical image confirm click, text send button click, and Enter keydown.
- **Truthful Telemetry & Loopback Write Trust**: Post-reservation telemetry calculates real `nextSendAt`. `POST /api/account-protection/telemetry` enforces loopback IP, version, OA header, and strict numeric schema.
- **Test Suite**: 127/127 Jest unit tests passing cleanly (`npm test`). Build passing cleanly (`npm run build`). JS syntax clean (`node --check run/LineSyncApp.js`).

## Exact Recommended Next Step

Await ChatGPT Control Plane review of `SAFE-WP001-R2`. Await explicit Project Owner authorization before starting `REL-WP002 — Job Lease + Heartbeat`. Do NOT start automatically.
