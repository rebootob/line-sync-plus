# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 670b0c695a95e20d2c3290212dc8164193d3fae2
* Working Tree: Clean (SYNC-WP001-R2 READY_FOR_CHATGPT_REVIEW)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.6) running inside `chat.line.biz` to send multi-type messages, sync customer directories, manage quotas, handle blocks/errors safely, report summary reports to Telegram, and persist browser diagnostic events.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: SYNC-WP001-R2

* **SYNC-WP001-R2**: `READY_FOR_CHATGPT_REVIEW`
* **SYNC-WP001**: `NOT CLOSED / LIVE UAT BLOCKED PENDING R2 REVIEW`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **OA-WP001-R1**: `CLOSED / PASS`
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `READY / NOT STARTED` (AUTHORIZATION REQUIRED)
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.6`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.6`

## Dashboard Gate Corrective Summary (SYNC-WP001-R2)

1. **Direct Backend Query**: `startCustomerSync()` in `index.html` fetches `${API_BASE}/bot/status` immediately before launching sync process.
2. **Fixed Reference**: Removed invalid variable reference `isBotEnabled` and synchronized UI state via `isMasterBotEnabled` and `updateMasterBotBtnUI()`.
3. **Fail-Closed**: Blocks sync if `/bot/status` check fails or if Master Bot is running (`enabled === true`).

## Exact Recommended Next Step

Await independent ChatGPT Control Plane code review and Project Owner instructions for SYNC-WP001-R2 review or next work package.
