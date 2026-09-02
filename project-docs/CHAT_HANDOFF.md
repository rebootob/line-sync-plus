# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: b0286e513ae314fcb1eca5a0044c96a72750b46b (oa: preserve same-job OA identity and restore roadmap)
* Working Tree: Clean (OA-WP001 / OA-WP001-R1 CLOSED / PASS)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.5) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist atomic, navigation-safe browser diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: OA-WP001 / OA-WP001-R1 (CLOSED / PASS)

* **OA-WP001**: `CLOSED / PASS`
* **OA-WP001-R1**: `CLOSED / PASS`
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `READY / NOT STARTED` (AUTHORIZATION REQUIRED)
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.5`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.5`

## Accepted Live UAT Evidence (Passed 2026-09-02)

1. **Database Migration / OA Discovery**: PASS (OA #1: 9,737 total / 9,176 active / 561 blocked; OA #2: 2,153 total / 2,151 active / 2 blocked).
2. **Dashboard OA Isolation**: PASS (OA #1 displayed only OA #1 customers; OA #2 displayed only OA #2 customers; no unselected list).
3. **Controlled Dashboard OA Switch**: PASS (Master Bot paused before switch; HTTP 409 Conflict rejection when active; activeBotId persisted cleanly).
4. **Controlled Physical LINE OA Switch**: PASS (Worker v28.5 aligned physical chat.line.biz OA with activeBotId before queue execution).
5. **OA #2 Live Send Path**: PASS (`JOB_RECEIVED` -> `NAVIGATE_TARGET` -> `PAGE_LOAD_ACTIVE_JOB` -> `RECIPIENT_VERIFY_OK` -> `TEXT_PRE_SEND_VERIFIED` -> `JOB_SUCCESS`; Wrong OA send = 0).
6. **Cross-OA Queue Isolation**: PASS (OA #2 worker does not claim OA #1 pending jobs; pending jobs remain owned by original OA until active again).

## Exact Recommended Next Step

Await Project Owner authorization before starting `REL-WP002 — Job Lease + Heartbeat`.
