# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 3b07da0e0ea5563f68f9a907690b8f31eb43276e (ops: fix runtime gate retry and strict fail-closed handling)
* Working Tree: Clean (OPS-WP001 documentation closure completed)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.3) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist atomic, navigation-safe browser diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Final Closure: OPS-WP001 & OPS-WP001-R1 (CLOSED / PASS)

* **OPS-WP001 Status**: **CLOSED / PASS**
* **OPS-WP001-R1 Status**: **CLOSED / PASS**
* **Worker Version**: `28.3`
* **Runtime Contract**: `1`
* **Required Worker**: `28.3`

### Key Verified UAT Results:
1. **UAT-01 (Matched Version)**: Worker v28.3 matched required backend version 28.3. 1-recipient live campaign completed cleanly (Success: 1, Fail: 0).
2. **UAT-02 (Incompatible Worker)**: Simulated worker header `X-LineSync-Worker-Version: 28.2` rejected with HTTP 409 Conflict. Job remained pending; no LINE send occurred. Real worker v28.3 claimed SAME pending job after Master Bot resumed (Success: 1, Fail: 0).
3. **UAT-03 (Backend Offline / Auto Recovery)**: Worker emitted `RUNTIME VERSION BLOCKED` when backend was stopped. No navigation or send occurred. When backend restarted, worker automatically recovered without requiring manual browser page reloads (Success: 1, Fail: 0).

## Deployment Rollout Safety Order

1. Pause / ensure no active campaign job.
2. Deploy Backend runtime gate requiring worker 28.3.
3. Update Tampermonkey worker to v28.3.
4. Verify runtime compatibility PASS.
5. Resume campaign operation.

*Deployment Safety Note*: OPS-WP001 cannot retroactively stop a message send that an OLD worker already physically started before deployment.

## Current State

Fully functional, hardened, and secured. Verified via `npm test` (33/33 tests passed), `npm run build` (clean NestJS build), `node --check run/LineSyncApp.js` (clean syntax), `git diff --check` (clean exit code 0), and `git ls-files telegram-config.json` (NO OUTPUT).

## Relevant Files

- `src/runtime-version.ts`: Runtime contract constant declarations.
- `src/app.controller.ts`: GET /api/runtime/version and GET /api/campaign/next fail-closed version gate.
- `run/LineSyncApp.js`: v28.3 worker, WORKER_VERSION header, checkRuntimeCompatibility handshake with fail-closed retry loop.
- `index.html`: Operator visibility badge.
- `src/app.controller.spec.ts`: Unit test suite for version gate.
- `project-docs/ACTIVE_TASK.md`, `project-docs/CHAT_HANDOFF.md`, `project-docs/CURRENT_STATE.md`, `project-docs/PROJECT_STATUS_ROADMAP.md`.

## Next Work Package Assignment

* **Next Work Package**: `REL-WP001 — Single Worker / Multi-Tab Lock`
* **Status**: `READY / NOT STARTED`
* **Authorization Required**: Await explicit Project Owner authorization before starting implementation.
