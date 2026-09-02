# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 0753a4cb0a2c9ca90bcb12ca986c61e4ea7ef450 (reliability: add single-worker multi-tab leader lock)
* Working Tree: Clean (REL-WP001-R1 implementation completed)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.4) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist atomic, navigation-safe browser diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: REL-WP001-R1 — Fail-Closed Lease Persistence + Complete Navigation Hold

* **Status**: `READY_FOR_CHATGPT_REVIEW` (REL-WP001: `READY_FOR_CHATGPT_REVIEW`, NOT CLOSED)
* **Key Implementation Details**:
  1. `writeAndVerifyLeaderRecord(record)` verifies `localStorage.setItem` by reading back and parsing stored JSON. Fails closed if write, read, parse, or field verification fails.
  2. `navigateAsLeader(targetUrl, reason)` extends navigation lease (`NAVIGATION_LEASE_MS = 45000`) and verifies read-back persistence before executing `window.location.href = targetUrl`. If extension fails, navigation is blocked.
  3. All 5 bot-controlled navigation sites in `LineSyncApp.js` route through `navigateAsLeader`.
  4. `confirmWorkerLeadershipForSend()` executes under Web Locks election mutex (`WORKER_ELECTION_LOCK`) immediately before physical image or text send clicks.
  5. 36/36 Jest unit tests passing cleanly; `node --check run/LineSyncApp.js` PASS; Nest build PASS.

## Scope Boundary
REL-WP001 / REL-WP001-R1 protects multi-tab execution within the SAME `chat.line.biz` browser profile/storage partition (`localStorage`). Cross-profile or cross-machine protection is NOT claimed and belongs to future work packages (REL-WP002/003).

## Exact Recommended Next Step

Await ChatGPT / Project Owner review of REL-WP001-R1 implementation on GitHub repository `rebootob/line-sync-plus`.
