# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 1b5953bbf9661a9e8fd52bc922b58c2d8aa0bf6e
* Working Tree: Clean (SYNC-WP001-R1 READY_FOR_CHATGPT_REVIEW)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.6) running inside `chat.line.biz` to send multi-type messages, sync customer directories, manage quotas, handle blocks/errors safely, report summary reports to Telegram, and persist browser diagnostic events.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: SYNC-WP001-R1

* **SYNC-WP001-R1**: `READY_FOR_CHATGPT_REVIEW`
* **SYNC-WP001**: `READY_FOR_CHATGPT_REVIEW (NOT CLOSED)`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **OA-WP001-R1**: `CLOSED / PASS`
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `READY / NOT STARTED` (AUTHORIZATION REQUIRED)
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.6`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.6`

## Refined Metrics & Corrective Implementation Summary (SYNC-WP001-R1)

1. **Full-Run `duplicateInSync` Deduplication**: Full-run `seenSyncUserIds` Set prevents duplicate contacts across different pages from causing duplicate writes or incorrect metric totals.
2. **Fail-Closed Pagination**: Repeated cursor loop or reaching max pages immediately aborts sync with Thai error banner (`isError = true`). Final PASS summary banner strictly requires `paginationCompleted === true`.
3. **Response Structure Verification**: Requires `Array.isArray(resp.contacts)`. Unexpected API responses abort immediately.
4. **Strict LINE User ID Validation**: Enforces `/^U[0-9a-fA-F]{32}$/` regex on client and server.

## Exact Recommended Next Step

Await independent ChatGPT Control Plane code review and Project Owner instructions for SYNC-WP001-R1 review or next work package.
