# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: e73d8136cdae7abd9c5584bfbf921ace0e14c887
* Working Tree: Clean (SYNC-WP001-R4 READY_FOR_CHATGPT_REVIEW)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.7) running inside `chat.line.biz` to send multi-type messages, sync customer directories, manage quotas, handle blocks/errors safely, report summary reports to Telegram, and persist browser diagnostic events.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: SYNC-WP001-R4

* **SYNC-WP001-R4**: `READY_FOR_CHATGPT_REVIEW`
* **SYNC-WP001**: `NOT CLOSED / LIVE UAT BLOCKED PENDING R4 REVIEW`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **OA-WP001-R1**: `CLOSED / PASS`
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `READY / NOT STARTED` (AUTHORIZATION REQUIRED)
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.7`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.7`

## Live Schema & Rate-Limit Corrective Summary (SYNC-WP001-R4)

1. **Live Schema Alignment**: `run/LineSyncApp.js` parses `resp.list` array and `resp.next` cursor from `GET /api/v2/bots/{botId}/contacts`.
2. **Display Name Mapping**: Maps `displayName` via `profile.nickname` -> `profile.name` -> `"ลูกค้า"`. Identity remains `profile.userId`.
3. **Bounded Rate-Limit Safety**: Handles 429/403 with bounded retries (max 3, increasing cooldown) + 200ms page pacing.
4. **Version Bump**: Bumped Worker version to `28.7`.

## Exact Recommended Next Step

Await independent ChatGPT Control Plane code review and Project Owner instructions for SYNC-WP001-R4 review or next work package.
