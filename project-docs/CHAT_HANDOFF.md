# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 35f70daffd914ecf64b8aa0944d236f93fce9fc7 (ops: add fail-closed runtime version gate for browser worker)
* Working Tree: Clean (OPS-WP001-R1 corrective completed)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.3) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist atomic, navigation-safe browser diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: OPS-WP001-R1 — Runtime Retry + Strict Fail-Closed Corrective

* **OPS-WP001-R1 Status**: `READY_FOR_CHATGPT_REVIEW`
* **OPS-WP001 Status**: `READY_FOR_CHATGPT_REVIEW`
* **Key Corrective Verification**:
  1. Incompatible `processQueue()` schedules retry via `setTimeout(processQueue, CHECK_INTERVAL)` without calling `/campaign/next` or claiming jobs.
  2. Incompatible page-load active job recovery preserves session parameters in `sessionStorage` without finishing/failing or fetching another job, and schedules retry via `setTimeout(() => resumeSavedActiveJob(savedJobData), CHECK_INTERVAL)`.
  3. When runtime compatibility eventually PASSES, the SAME saved active job is resumed safely through recipient & 404 guards.
  4. Refactored `fetchAPI()` so only HTTP 2xx responses resolve. Non-2xx (including 409) reject, preventing malformed 409 responses from synthesizing compatible version objects.
  5. Backend `/campaign/next` version gate remains at the VERY BEGINNING of `getNextJob()` before repository query/save.
  6. All 33 Jest unit tests passing cleanly; `node --check run/LineSyncApp.js` PASS; Nest build PASS.

## Deployment Rollout Safety Order

1. Pause / ensure no active campaign job.
2. Deploy Backend runtime gate requiring worker 28.3.
3. Update Tampermonkey worker to v28.3.
4. Verify runtime compatibility PASS.
5. Resume campaign operation.

*Deployment Safety Note*: OPS-WP001/R1 cannot retroactively stop a message that an OLD worker already physically started sending before deployment.

## Current State

Fully functional and verified via `npm test` (33/33 tests passed), `npm run build` (clean NestJS build), `node --check run/LineSyncApp.js` (clean syntax), `git diff --check` (clean exit code 0), and `git ls-files telegram-config.json` (NO OUTPUT).

## Exact Recommended Next Step

Await ChatGPT / Project Owner review of OPS-WP001-R1 corrective implementation on GitHub repository `rebootob/line-sync-plus`.
