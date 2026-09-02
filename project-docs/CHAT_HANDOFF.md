# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 23feb247a165a4188e8fece685a160be70b80cd1 (reliability: prevent duplicate-tab worker identity cloning)
* Working Tree: Clean (REL-WP001 / R1 / R2 CLOSED / PASS)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.4) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist atomic, navigation-safe browser diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: REL-WP001 / REL-WP001-R1 / REL-WP001-R2

* **Status**: `CLOSED / PASS`
* **Live UAT Evidence Accepted**:
  - **UAT-01 (Multi-Tab Election)**: PASS (1 Leader, 1 Standby).
  - **UAT-02 (Duplicate Tab Clone Defense)**: PASS (`[REL] DUPLICATE TAB IDENTITY DETECTED` -> new `tabSessionId` assigned, copied lease not reused).
  - **UAT-03 (Leader Failover)**: PASS (Original leader closed -> `[REL] WORKER LEADER TAKEOVER`, only 1 Leader active).
  - **UAT-04 (Live Single Consumption)**: PASS (2 tabs open -> 1-recipient campaign sent by Leader alone, Target=1, Success=1, Fail=0, Duplicate Send=0).
* **Key Implementation Details**:
  1. Worker version `28.4`, Runtime Contract `1`, Required Worker `28.4`.
  2. Document-lifetime tab identity lock (`ensureTabIdentity`) prevents duplicated tab identity cloning.
  3. Fail-closed lease write-and-readback verification (`writeAndVerifyLeaderRecord`).
  4. Complete navigation hold coverage across all full-page reloads (`navigateAsLeader`).
  5. Atomic pre-send fencing under Web Locks election mutex (`confirmWorkerLeadershipForSend`).

## Accepted Safety Scope Boundary
Single Worker / Multi-Tab protection applies strictly within the SAME `chat.line.biz` browser profile / storage partition. Cross-browser, cross-profile, or cross-machine protection is NOT claimed and remains future reliability scope (REL-WP002/003).

## Next Candidate: OA-WP001 — OA Context Isolation & Controlled LINE OA Switch

- **Status**: `READY / NOT STARTED`
- **Discovered Database Truth**:
  - Database contains customers under 2 real LINE OA bot IDs (OA #1: 9,737 total / OA #2: 2,153 total).
  - Composite identity: `(botId, lineUserId)`.
  - Repository `Customer` entity needs alignment against composite identity during `OA-WP001`.
  - Do NOT implement `OA-WP001` without explicit authorization from Project Owner.

## Exact Recommended Next Step

Await authorization and prompt for `OA-WP001` or next work package from Project Owner / ChatGPT Control Plane.
