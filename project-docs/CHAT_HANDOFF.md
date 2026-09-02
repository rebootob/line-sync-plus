# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 4677c8b6c7fbd7f37e6b41b3128341386b07215b
* Working Tree: Clean (SYNC-WP001-R5 READY_FOR_CHATGPT_REVIEW)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.8) running inside `chat.line.biz` to send multi-type messages, sync customer directories, manage quotas, handle blocks/errors safely, report summary reports to Telegram, and persist browser diagnostic events.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: SYNC-WP001-R5

* **SYNC-WP001-R5**: `READY_FOR_CHATGPT_REVIEW`
* **SYNC-WP001**: `NOT CLOSED / LIVE UAT PENDING R5 REVIEW`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **OA-WP001-R1**: `CLOSED / PASS`
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `READY / NOT STARTED` (AUTHORIZATION REQUIRED)
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.8`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.8`

## Live Schema & Source Correction Summary (SYNC-WP001-R5)

1. **Full Sync Endpoint Correction**: Switched customer directory source from `/contacts` to `/chats?folderType=ALL&limit=20&prioritizePinnedChat=true`. Live read-only evidence proved `/contacts` (5,112 unique) is a strict subset of `/chats` (9,741-9,742 unique). Overlap with DB = 9,741 (0 chats-only, 6 DB-only preserved).
2. **Extraction & Safety**: Consumes `resp.list` and `resp.next`. Maps `profile.nickname` -> `profile.name` -> `"ลูกค้า"`. Identity remains `profile.userId`. Zero message/event data extracted.
3. **Version Bump**: Bumped Worker version to `28.8`.

## Exact Recommended Next Step

Await independent ChatGPT Control Plane code review and Project Owner instructions for SYNC-WP001-R5 review or next work package.
