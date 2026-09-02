# ACTIVE TASK

```yaml
ACTIVE_WORK_PACKAGE: SYNC-WP001-R2 — Dashboard Master Bot Sync Gate Corrective
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZED_BY: Project Owner & ChatGPT Control Plane
TASK_TYPE: BOUNDED_CORRECTIVE
```

---

## 📋 Work Package Summary: SYNC-WP001-R2

### Status Summary
- **SYNC-WP001-R2**: `READY_FOR_CHATGPT_REVIEW`
- **SYNC-WP001**: `NOT CLOSED / LIVE UAT BLOCKED PENDING R2 REVIEW`
- **OA-WP001**: `CLOSED / PASS` (Accepted on Worker v28.5)
- **REL-WP001**: `CLOSED / PASS`
- **REL-WP002**: `READY / NOT STARTED`
- **REL-WP003**: `NOT STARTED`

### Version Contracts
- **Worker Version**: `28.6`
- **Runtime Contract Version**: `2`
- **Required Worker Version**: `28.6`

---

## 🔍 Corrective Solutions Applied (SYNC-WP001-R2)

1. **Dashboard Master Bot Status Re-check Gate (`index.html`)**:
   - `startCustomerSync()` fetches `${API_BASE}/bot/status` immediately before allowing sync.
   - Replaced invalid variable reference `isBotEnabled` with authoritative backend query `statusData.enabled`.
   - Fail-closed error handling: if `/bot/status` fetch fails, displays Thai error `"ไม่สามารถตรวจสอบสถานะ Master Bot ได้ กรุณาลองใหม่"` and aborts without opening contact page.
   - If `statusData.enabled === true`, displays `"กรุณา Pause Master Bot ก่อน Sync รายชื่อลูกค้า"`, syncs UI state via `updateMasterBotBtnUI()`, and aborts without opening contact page.
   - If `statusData.enabled === false`, syncs UI state and proceeds to user confirmation dialog.

2. **Regression Test Addition (`src/app.controller.spec.ts`)**:
   - Added static check verifying `index.html` `startCustomerSync()` queries `${API_BASE}/bot/status` and does not contain `if (isBotEnabled)`.

---

## 🧪 Verification Results

- **Unit Tests**: 75 passed (`npm test`)
- **Build**: Clean (`npm run build`)
- **Diff Check**: Clean (`git diff --check`)
