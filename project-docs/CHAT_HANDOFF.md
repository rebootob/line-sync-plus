# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 696db541c2a4957e149669b1d10f43b5bc542044 (sync: add OA-isolated customer directory sync)
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

## Refined Metrics & Reporting Implementation Summary (SYNC-WP001)

1. **Independent Metric Contract**:
   - `contactsFetched`: Total contact records received from LINE across pages.
   - `inserted`: Newly inserted customers.
   - `updatedName`: Existing customers with updated `displayName`.
   - `existingUnchanged`: Existing customers with unchanged `displayName` (Primary "มีอยู่แล้ว / ซ้ำกับ DB").
   - `duplicateInSync`: Duplicate `lineUserId` encountered in same sync run.
   - `invalid`: Unusable/invalid contacts.
   - `pagesFetched`: Total API pages fetched.
   - `dbTotalAfterSync`: Final customer count in DB for synced `botId`.
   - `elapsedSeconds`: Total sync execution time.
2. **Backend Batch Endpoint**: `POST /api/customers/sync-batch` returns `{ success: true, received, inserted, updatedName, existingUnchanged, duplicateInBatch, invalid }`.

## Exact Recommended Next Step

Await independent ChatGPT Control Plane code review and Project Owner instructions for SYNC-WP001 review or next work package.
