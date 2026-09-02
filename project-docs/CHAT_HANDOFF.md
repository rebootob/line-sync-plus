# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: a57ac6a042c37d7acdf86c0e0da25e76597bf5ca (docs: close OPS-WP001 after live runtime gate UAT)
* Working Tree: Clean (REL-WP001 implementation completed)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.4) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist atomic, navigation-safe browser diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: REL-WP001 — Single Worker / Multi-Tab Lock

* **Status**: `READY_FOR_CHATGPT_REVIEW`
* **Key Implementation Details**:
  1. Worker version upgraded to `28.4` (`run/LineSyncApp.js`, `src/runtime-version.ts`, `index.html`, `src/app.controller.spec.ts`).
  2. Multi-tab leader election using `navigator.locks.request('linesync_worker_election_v1', ...)` as exclusive election mutex.
  3. Shared durable leader lease record in `localStorage` under `linesync_worker_leader_v1`:
     `{ ownerTabSessionId, leaseId, workerVersion, acquiredAt, expiresAt }`.
  4. Lease duration: `WORKER_LEASE_MS = 20000` (20s), renewed every 4s (`WORKER_RENEW_INTERVAL_MS = 4000`).
  5. Same-tab navigation continuity: `extendLeadershipForNavigation()` extends lease by 45s (`NAVIGATION_LEASE_MS = 45000`) before bot-controlled navigations.
  6. Non-leader tabs remain STANDBY, retry election periodically, and NEVER fetch `/campaign/next`.
  7. Pre-send fencing re-verifies leadership at 6 key checkpoints. Leadership loss routes to `handleLeadershipLost()`, clearing local active job session fields without calling `finishJob(false)` or incrementing counters.
  8. All 33 Jest unit tests passing cleanly; `node --check run/LineSyncApp.js` PASS; Nest build PASS.

## Scope Boundary
REL-WP001 protects multi-tab execution within the SAME `chat.line.biz` browser profile/storage partition (`localStorage`). Cross-profile or cross-machine protection is NOT claimed and belongs to future work packages (REL-WP002/003).

## Exact Recommended Next Step

Await ChatGPT / Project Owner review of REL-WP001 implementation on GitHub repository `rebootob/line-sync-plus`.
