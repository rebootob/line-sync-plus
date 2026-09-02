# CHAT HANDOFF

## Repository

* Repository: rebootob/line-sync-plus
* Canonical Branch: main
* LAST_REVIEWED_IMPLEMENTATION_BASELINE: 53bf4247307a798dbbc019583edf41be7ff947f9 (reliability: fail closed worker lease and navigation handoff)
* Working Tree: Clean (REL-WP001-R2 implementation completed)

## Project Purpose

LineSync Plus is an automated LINE Official Account (LINE OA) customer contact synchronization, group segmentation, and broadcast campaign management platform. It combines a NestJS backend REST API with a single-page HTML dashboard and a client-side Tampermonkey userscript (`LineSyncApp.js` v28.4) running inside `chat.line.biz` to send multi-type messages, manage quotas, handle blocks/errors safely, report detailed summary reports to Telegram, and persist atomic, navigation-safe browser diagnostic events to local backend logs.

## Technology Stack

- **Backend**: NestJS (v11), Node.js, TypeScript, TypeORM, PostgreSQL (`pg`)
- **Frontend Dashboard**: HTML5, CSS3, JavaScript (Fetch API, DOM manipulation)
- **Client Automation**: Tampermonkey Userscript (Native DOM & Synthetic Event dispatch)
- **External Integrations**: Telegram Bot API (`https://api.telegram.org`)
- **Testing & Tooling**: Jest (`ts-jest`), ESLint, Prettier

## Work Package Status: REL-WP001-R2 — Duplicate-Tab Identity Clone Defense

* **Status**: `READY_FOR_CHATGPT_REVIEW` (REL-WP001-R1: `READY_FOR_CHATGPT_REVIEW`, REL-WP001: `READY_FOR_CHATGPT_REVIEW`, NOT CLOSED)
* **Key Implementation Details**:
  1. Document-lifetime tab identity lock `linesync_tab_identity_v1_<tabSessionId>` claimed via non-blocking Web Locks (`ifAvailable: true`).
  2. Duplicate tab detection: If identity lock is already held by another live tab, logs `[REL] DUPLICATE TAB IDENTITY DETECTED`, reassigns a new `tabSessionId`, removes copied lease (`linesync_tab_lease_id`) and active-job session fields without altering `localStorage` leader record or reporting jobs, and logs `[REL] NEW TAB IDENTITY ASSIGNED`.
  3. Leadership check (`hasValidWorkerLeadership`), election/renewal (`ensureWorkerLeadership`), and pre-send confirmation (`confirmWorkerLeadershipForSend`) strictly enforce `isTabIdentityVerified === true`.
  4. 39/39 Jest unit tests passing cleanly; `node --check run/LineSyncApp.js` PASS; Nest build PASS.

## Scope Boundary
REL-WP001 / REL-WP001-R1 / REL-WP001-R2 protects multi-tab execution within the SAME `chat.line.biz` browser profile/storage partition (`localStorage`). Cross-profile or cross-machine protection is NOT claimed and belongs to future work packages (REL-WP002/003).

## Exact Recommended Next Step

Await ChatGPT / Project Owner review of REL-WP001-R2 implementation on GitHub repository `rebootob/line-sync-plus`.
