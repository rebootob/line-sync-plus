# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 1d1640080c97b9ff180d0be7ea11da84090a1f6c (docs: close OA-WP001 after live cross-OA UAT)
* Working Tree: Clean (SYNC-WP001 READY_FOR_CHATGPT_REVIEW)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.6) running inside `chat.line.biz` to send multi-type messages, sync customer directories, manage quotas, handle blocks/errors safely, report summary reports to Telegram, and persist browser diagnostic events.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: SYNC-WP001

* **SYNC-WP001**: `READY_FOR_CHATGPT_REVIEW` (NOT CLOSED)
* **OA-WP001**: `CLOSED / PASS`
* **OA-WP001-R1**: `CLOSED / PASS`
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `READY / NOT STARTED` (AUTHORIZATION REQUIRED)
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.6`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.6`

## Discovery Findings & Implementation Summary (SYNC-WP001)

1. **LINE Contacts API Discovery**:
   - Endpoint: `GET /api/v2/bots/{botId}/contacts?query=&sortKey=DISPLAY_NAME&sortOrder=ASC&filterKey=ALL&limit=20`
   - Opaque pagination cursor `response.next`.
   - Cursor privacy invariant: Cursor values are never hardcoded, persisted, written to diagnostic logs, or printed.
2. **Backend Sync Batch Endpoint**: `POST /api/customers/sync-batch` accepts batch up to 250 records, requires loopback origin, valid botId format, matching activeBotId, and Master Bot PAUSED. Deduplicates in batch and preserves existing block/safety status.
3. **Userscript Execution**: Triggered via `#sync-customers` hash navigation, protected by `linesync_customer_sync_v1` Web Lock.

## Exact Recommended Next Step

Await independent ChatGPT Control Plane code review and Project Owner instructions for SYNC-WP001 review or next work package.
