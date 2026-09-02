# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: b1d6ba8a669eaa98b167a7ad2d34712c85c02953
* Working Tree: Clean (SYNC-WP001 CLOSED / PASS)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.8) running inside `chat.line.biz` to send multi-type messages, sync customer directories, manage quotas, handle blocks/errors safely, report summary reports to Telegram, and persist browser diagnostic events.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status

* **SYNC-WP001 — LINE OA Customer Directory Sync to DB**: `CLOSED / PASS`
* **SYNC-WP001-R1**: `CLOSED / PASS`
* **SYNC-WP001-R2**: `CLOSED / PASS`
* **SYNC-WP001-R3**: `CLOSED / PASS`
* **SYNC-WP001-R4**: `CLOSED / PASS`
* **SYNC-WP001-R5**: `CLOSED / PASS`
* **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
* **OA-WP001-R1**: `CLOSED / PASS`
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `READY / NOT STARTED / AUTHORIZATION REQUIRED`
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.8`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.8`

## Accepted Live UAT Summary (SYNC-WP001 / Worker v28.8)

- **Target OA**: OA #1 (`U09d6b286c73c14c12cb6b8479d105941`)
- **Full Directory Endpoint**: `GET /api/v2/bots/{botId}/chats?folderType=ALL&limit=20&prioritizePinnedChat=true`
- **Metrics**:
  - LINE Records Fetched: `9,741`
  - Inserted: `0`
  - Display Names Updated: `4,629`
  - Existing Unchanged: `5,112`
  - Duplicates Within Sync: `0`
  - Invalid/Skipped: `0`
  - Pages: `488`
  - DB Total After Sync: `9,747`
  - Elapsed Time: `341.4 seconds`
  - Reconciliation: `4,629 + 5,112 = 9,741`
  - Non-Destructive Policy: DB stayed at `9,747`. The `6` DB-only records were NOT deleted, NOT marked blocked, and NOT marked inactive.

## Exact Recommended Next Step

Await explicit Project Owner authorization before starting the next candidate work package: `REL-WP002 — Job Lease + Heartbeat`. Do NOT start automatically.
