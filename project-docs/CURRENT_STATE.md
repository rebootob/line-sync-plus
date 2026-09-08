# CURRENT STATE — LineSync Plus

**Last Updated**: 2026-09-09 — P3-WP003-PRE1-R2 corrective authorization

```yaml
CONTROL_VERSION: 37
ACTIVE_WORK_PACKAGE: P3-WP003-PRE1-R2
TASK_ID: P3-WP003-PRE1-R2
PARENT_TASK: P3-WP003-PRE1-R1
AUTHORIZATION_REVISION: P3-WP003-PRE1-R2-CONTRACT-ACCURACY-DECISION-CLOSURE
STATUS: CORRECTIVE_AUTHORIZED
AUTHORIZE_EXECUTION: TRUE
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_R2_EVIDENCE
PHASE_0: CLOSED / PASS
PHASE_1: CLOSED / PASS
PHASE_2: CLOSED / PASS
PHASE_3: IN PROGRESS
P3-WP001: CLOSED / PASS
P3-WP002: CLOSED / PASS
P3-WP003-PRE1: CORRECTIVE REQUIRED / SUPERSEDED
P3-WP003-PRE1-R1: CORRECTIVE REQUIRED / SUPERSEDED_BY_R2
P3-WP003-PRE1-R2: CORRECTIVE_AUTHORIZED / EVIDENCE_ONLY
P3-WP003: FUTURE / IMPLEMENTATION NOT AUTHORIZED
```

## Accepted Baseline
- Code baseline: `6c555a54c114cdad0aa78a43f508a5b297df6546`
- R1 evidence HEAD under correction: `372c7fb35aea65d25e2eea6efffc18b7ef0d14e9`
- P3-WP002 accepted implementation: `03dd35a5d6b29c6394f93f16061bfaddb5f10174`
- P3-WP002 accepted evidence: `135f915726f2ab8d20d58b8b3dccd0aa38b1a1f6`

## What We Are Doing Now

We are not implementing Persistent Tags & Advanced Segmentation yet. We are locking the design contract so future implementation is based on the actual repository rather than assumptions.

R2 must correct current-source truth, preserve WP002 names, close all ambiguous decisions, complete API/error/idempotency semantics, finish bounded implementation package contracts, finish mandatory acceptance tests and synchronize the five control documents.

## Current Known Source Truth to Preserve

`Customer` currently uses `botId` + `lineUserId` identity and includes `displayName`, `pictureUrl`, `statusMessage`, `isBlocked`, `blockReason`, timestamps and `imageUrl`. R2 must not describe a nonexistent current status enum field.

Current `GET /api/customers` is OA-scoped using `botId`, validates active OA before customer/activity reads and returns accepted WP002 activity fields. Future search/status/tag segmentation features must be labeled future candidate behavior rather than current behavior.

Accepted WP002 activity response names remain:
- `successfulJobCount`
- `lastSuccessfulSendAt`
- `failedJobCount`
- `reconcileRequiredCount`
- `latestJobStatus`
- `latestJobCreatedAt`

## Scope / Safety

R2 is EVIDENCE-ONLY. No source, test, UI, schema, package, Worker, LINE, Live UAT or Telegram implementation is authorized.

Permanent safety truth remains unchanged: true exactly-once physical LINE delivery is NOT GUARANTEED; ambiguous physical sends must never automatically resend.

## Progress
- Official accepted: ~61%
- Practical implementation: ~61%

P3-WP003 remains FUTURE / IMPLEMENTATION NOT AUTHORIZED until PRE1 contract review passes and the Owner explicitly authorizes implementation.
