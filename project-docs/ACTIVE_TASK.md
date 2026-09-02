# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: OPS-WP001 — Runtime Version Gate
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: ChatGPT / Control Plane
TASK_TYPE: OPERATIONAL_HARDENING
```

---

## 📋 Completed Work Package Summary: OPS-WP001

### Implemented Operational Version Gate Controls:
1. **Backend Runtime Contract (`src/runtime-version.ts`)**:
   - Declared `RUNTIME_CONTRACT_VERSION = 1` and `REQUIRED_WORKER_VERSION = '28.3'`.
2. **Backend Runtime Version Endpoint (`GET /api/runtime/version`)**:
   - Exposes safe contract info `{ runtimeContractVersion: 1, requiredWorkerVersion: "28.3" }` without exposing system paths or secrets.
3. **Fail-Closed Gate on `GET /api/campaign/next`**:
   - Reads `X-LineSync-Worker-Version` header at the VERY BEGINNING of `getNextJob()` before querying or mutating any `CampaignJob` or `Campaign`.
   - If missing or header != `'28.3'`, immediately blocks job claim with HTTP 409 Conflict (`{ status: "version_mismatch", requiredWorkerVersion: "28.3" }`).
   - Rejection occurs BEFORE job selection, claim status mutation, counter increment, or recipient payload disclosure.
4. **Tampermonkey Worker v28.3 (`run/LineSyncApp.js`)**:
   - Metadata updated `@version 28.3`.
   - Declared constant `const WORKER_VERSION = '28.3'`.
   - `fetchAPI()` automatically sends header `X-LineSync-Worker-Version: WORKER_VERSION`.
   - Added `checkRuntimeCompatibility()` performing handshake against `/api/runtime/version`.
   - Gate in `processQueue()` blocks fetching `/campaign/next` if compatibility check fails.
   - Page-load active job recovery requires runtime compatibility PASS before resuming saved job. If incompatible, active job session state is safely preserved without finishing/failing or executing.
5. **Dashboard Visibility (`index.html`)**:
   - Displays non-intrusive badge `Runtime Contract: v1 | Required Worker: v28.3` fetched dynamically via `loadRuntimeVersionUI()`.
6. **Deployment Rollout Safety Order**:
   - **Step 1**: Pause campaign / ensure no active campaign job.
   - **Step 2**: Deploy Backend runtime gate requiring worker `28.3`.
   - **Step 3**: Update Tampermonkey worker to v28.3.
   - **Step 4**: Verify runtime compatibility PASS.
   - **Step 5**: Resume campaign operation.
   - *Deployment Safety Note*: OPS-WP001 cannot retroactively stop a message that an OLD worker already physically started sending before deployment.

---

## ⛔ Execution Policy

- **Work Package Status**: `READY_FOR_CHATGPT_REVIEW` (Do NOT mark CLOSED yet).
- **Next Work Packages**:
  - `REL-WP001`: `NOT STARTED`
  - `REL-WP002`: `NOT STARTED`
  - `REL-WP003`: `NOT STARTED`
- **Next Step**: Await review and authorization from ChatGPT / Control Plane.
