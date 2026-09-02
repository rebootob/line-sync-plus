# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 6d4798b00103fb675d403905ec0f22b36feaeadf (docs: close SEC-WP001 after Telegram credential rotation)
* Working Tree: Clean (OPS-WP001 implementation completed)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.3) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist atomic, navigation-safe browser diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: OPS-WP001 — Runtime Version Gate

* **Status**: `READY_FOR_CHATGPT_REVIEW`
* **Key Implementation Details**:
  1. Created `src/runtime-version.ts` declaring `RUNTIME_CONTRACT_VERSION = 1` and `REQUIRED_WORKER_VERSION = '28.3'`.
  2. Exposed `GET /api/runtime/version` returning safe runtime version info.
  3. Added fail-closed gate at the VERY BEGINNING of `GET /api/campaign/next` validating `X-LineSync-Worker-Version` header before querying/mutating any job or campaign. Missing/incompatible version returns HTTP 409 Conflict.
  4. Updated Tampermonkey worker `run/LineSyncApp.js` to `@version 28.3` with `WORKER_VERSION = '28.3'`.
  5. Configured `fetchAPI()` to attach `X-LineSync-Worker-Version: WORKER_VERSION` header automatically.
  6. Added `checkRuntimeCompatibility()` handshake function in worker.
  7. Added version gate in `processQueue()` and page-load active job recovery (preserves saved job safely if incompatible).
  8. Displayed minimal runtime contract visibility in Dashboard UI (`index.html`).
  9. Added 5 focused Jest unit tests in `src/app.controller.spec.ts` covering missing header rejection, wrong version rejection, pre-claim rejection timing, and valid version execution.
  10. All 33 Jest unit tests passing cleanly; `node --check run/LineSyncApp.js` PASS; Nest build PASS.

## Deployment Rollout Safety Order

1. Pause / ensure no active campaign job.
2. Deploy Backend runtime gate requiring worker 28.3.
3. Update Tampermonkey worker to v28.3.
4. Verify runtime compatibility PASS.
5. Resume campaign operation.

*Deployment Safety Note*: OPS-WP001 cannot retroactively stop a message that an OLD worker already physically started sending before deployment.

## Current State

Fully functional and verified via `npm test` (33/33 tests passed), `npm run build` (clean NestJS build), `node --check run/LineSyncApp.js` (clean syntax), `git diff --check` (clean exit code 0), and `git ls-files telegram-config.json` (NO OUTPUT).

## Relevant Files

- `src/runtime-version.ts`: Runtime contract constant declarations.
- `src/app.controller.ts`: GET /api/runtime/version and GET /api/campaign/next fail-closed version gate.
- `run/LineSyncApp.js`: v28.3 worker, WORKER_VERSION header, checkRuntimeCompatibility handshake.
- `index.html`: Operator visibility badge.
- `src/app.controller.spec.ts`: Unit test suite for version gate.
- `project-docs/ACTIVE_TASK.md`, `project-docs/CHAT_HANDOFF.md`, `project-docs/CURRENT_STATE.md`, `project-docs/PROJECT_STATUS_ROADMAP.md`.

## Exact Recommended Next Step

Await ChatGPT / Project Owner review of OPS-WP001 implementation on GitHub repository `rebootob/line-sync-plus`.
