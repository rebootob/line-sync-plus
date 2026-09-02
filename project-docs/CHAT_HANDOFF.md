# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: a89db460e5d519084ceacf2fcf354f438dbbe6ae (oa: implement multi-OA context isolation, DB schema updates, and controlled switch)
* Working Tree: Clean (OA-WP001-R1 READY_FOR_CHATGPT_REVIEW)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.5) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist atomic, navigation-safe browser diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: OA-WP001 / OA-WP001-R1

* **OA-WP001-R1**: `READY_FOR_CHATGPT_REVIEW`
* **OA-WP001**: `READY_FOR_CHATGPT_REVIEW` (NOT CLOSED)
* **REL-WP001**: `CLOSED / PASS`
* **REL-WP002**: `NOT STARTED`
* **REL-WP003**: `NOT STARTED`
* **Version Contracts**:
  - Worker Version: `28.5`
  - Runtime Contract Version: `2`
  - Required Worker Version: `28.5`

## Key Implementation Details (OA-WP001-R1)

1. **Terminal Fallback**: `POST /api/campaign/success` & `POST /api/campaign/fail` enforce valid `botId` + `lineUserId` + `status: 'processing'` fallback when `jobId` is absent. Blocked customer update requires `job.botId` + `job.lineUserId`.
2. **Mandatory Job OA Fence**: Pre-physical send guards require valid `expectedBotId` matching current OA.
3. **Saved Job Recovery**: Saved job recovery reads `linesync_job_botid` and calls `clearLocalActiveJobState()` if missing or malformed.
4. **Central Active Job Cleanup**: `clearLocalActiveJobState()` helper cleans all local active job session storage fields.
5. **Worker Reporting Payload**: `/campaign/success` & `/campaign/fail` carry expected job `botId`.
6. **Queue OA Gate**: `/campaign/next` enforces strict matching of `selectedJob.botId === activeBotId` without fallbacks.
7. **Group Scope**: `GET /api/groups/:id` & `DELETE /api/groups/:id` enforce valid `botId` query param (`?botId=...`).
8. **Restored Image Upload**: Restored image upload endpoint contract to parent baseline (`process.cwd()/uploads`, returning `{ success: true, url, filename }`).

## Exact Recommended Next Step

Await independent ChatGPT Control Plane code review and Project Owner instructions for Live UAT or next work package.
