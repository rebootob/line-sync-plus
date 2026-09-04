# EXECUTION GATE

CONTROL_VERSION: 2

TASK_ID:
MON-WP002-CLOSE

TITLE:
Close MON-WP002 After Independent Review

STATUS:
CLOSED_PASS

AUTHORIZED_BY:
Project Owner

CONTROL_PLANE:
ChatGPT

EXECUTION_PLANE:
Antigravity

CANONICAL_BRANCH:
main

ACCEPTED_REVIEW_HEAD:
5b34269397afbd9046610c366d9f0c27bf3d5532

ACCEPTED_REVIEW_RESULT:
PASS

NEXT_TASK:
NONE

NEXT_TASK_STATUS:
AWAITING_OWNER_DIRECTION

--------------------------------------------------
ACCEPTED EVIDENCE SUMMARY
--------------------------------------------------

- MON-WP002 focused tests: 23/23 PASS
- full suite: 317/317 PASS
- evidence classification: LOCAL REPORTED evidence
- no GitHub CI/status/workflow evidence
- no Live LINE UAT was required/performed
- Worker remains 28.16
- Required Worker remains 28.16
- Runtime Contract remains 2
- never automatically resend ambiguous physical sends
- observability endpoints remain read-only

--------------------------------------------------
MON-WP002 OBJECTIVE (COMPLETED / CLOSED_PASS)
--------------------------------------------------

Implement read-only operational monitoring for the active LINE OA:

- pending jobs
- processing jobs
- active valid leases
- expired leases
- processing jobs with missing lease fields
- residual lease fields on non-processing jobs
- reconcile_required jobs
- reconcile_required send parts
- stale armed send parts
- paused_reconcile campaigns

OBSERVABILITY ONLY.

No recovery.
No mutation.
No resend.
No reconciliation action.

--------------------------------------------------
IMPLEMENTATION FILES
--------------------------------------------------

- src/app.controller.ts
- src/app.controller.spec.ts
- index.html

Supporting docs:

- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md
- project-docs/EXECUTION_GATE.md

--------------------------------------------------
PROHIBITED FILES (VERIFIED UNTOUCHED)
--------------------------------------------------

- run/LineSyncApp.js
- src/runtime-version.ts
- src/entities/**
- src/database-init.service.ts
- src/telegram.service.ts
- package/dependency files
- migrations/schema
- secrets/configuration

Worker remains:
28.16

Required Worker remains:
28.16

Runtime Contract remains:
2

--------------------------------------------------
BACKEND
--------------------------------------------------

Implemented:

GET /api/ops/queue

Loopback only:

- 127.0.0.1
- ::1
- ::ffff:127.0.0.1

Remote:
HTTP 403.

Use socket remote address.
Do not trust X-Forwarded-For over socket address.

Endpoint is read-only.

No:
- save
- update
- delete
- state mutation
- lease renewal
- reclaim
- reconciliation resolution
- worker observation mutation

--------------------------------------------------
ACTIVE OA SCOPING
--------------------------------------------------

All metrics must be strictly scoped to authoritative activeBotId.

Do NOT expose activeBotId.

No active OA:

- do not aggregate globally
- all counts = null
- oa.active = false
- status = attention

OA lookup failure:

- all counts = null
- oa.active = null
- status = degraded

Never convert failure to zero.

--------------------------------------------------
METRICS
--------------------------------------------------

queue.pending:

CampaignJob status = pending

queue.processing:

CampaignJob status = processing

leases.active:

status = processing
AND leaseToken not null
AND leaseOwner not null
AND leaseExpiresAt not null
AND leaseExpiresAt > NOW

Do not require leaseHeartbeatAt.

leases.expired:

status = processing
AND leaseToken not null
AND leaseOwner not null
AND leaseExpiresAt not null
AND leaseExpiresAt <= NOW

expired > 0 => attention

leases.missing:

status = processing
AND at least one is null:

- leaseToken
- leaseOwner
- leaseExpiresAt

Count each job once.

missing > 0 => attention

leases.residual:

status != processing
AND any field remains populated:

- leaseToken
- leaseOwner
- leaseExpiresAt
- leaseHeartbeatAt

Count each job once.

residual > 0 => attention

reconciliation.jobs:

CampaignJob status = reconcile_required

reconciliation.parts:

CampaignSendPart status = reconcile_required

reconciliation.staleArmed:

CampaignSendPart status = armed
AND either:

- armedAt IS NULL
OR
- armedAt <= NOW - 60 seconds

Do not mutate/quarantine from monitoring endpoint.

reconciliation.pausedCampaigns:

Campaign status = paused_reconcile

Any reconciliation anomaly > 0 => attention.

--------------------------------------------------
FAILURE TRUTH
--------------------------------------------------

All operational counts start as null.

Only expose numeric metrics after the complete monitoring query set
succeeds.

If ANY required monitoring query fails:

- status = degraded
- ALL queue/lease/reconciliation counts = null

No partial success metrics.
No catch-and-return-zero.
No `|| 0`.

Numeric zero is valid only after genuine successful queries.

--------------------------------------------------
STATUS
--------------------------------------------------

degraded if:

- active OA lookup fails
OR
- any required metric query fails

attention if:

- no active OA
OR expired > 0
OR missing > 0
OR residual > 0
OR reconciliation.jobs > 0
OR reconciliation.parts > 0
OR staleArmed > 0
OR pausedCampaigns > 0

otherwise:

healthy

pending > 0 alone is NOT attention.

processing > 0 alone is NOT attention.

active leases > 0 alone are NOT attention.

--------------------------------------------------
RESPONSE
--------------------------------------------------

Aggregate counts only.

Equivalent structure:

{
  success,
  status,
  oa: {
    active
  },
  queue: {
    pending,
    processing
  },
  leases: {
    active,
    expired,
    missing,
    residual
  },
  reconciliation: {
    jobs,
    parts,
    staleArmed,
    pausedCampaigns
  },
  checkedAt
}

Do NOT expose:

- botId
- activeBotId
- lineUserId
- names
- message content
- campaign message/body
- leaseToken
- leaseOwner
- dispatchToken
- dispatchOwner
- armRequestId
- reconcileReason
- cookies
- Telegram data
- credentials/secrets

--------------------------------------------------
DASHBOARD
--------------------------------------------------

Compact monitoring for:

- Pending
- Processing
- Active Lease
- Expired Lease
- Missing Lease
- Residual Lease
- Reconcile Jobs
- Reconcile Parts
- Stale Armed
- Paused Reconcile

Rules:

numeric zero => 0

positive anomaly => visible warning

null/unavailable => ? Unknown

network/API failure => ? Unknown

unknown must never render green

pending/processing/active lease positive values are informational

Polling: 6000ms consistent with MON-WP001.

No write/retry/reset/reconcile controls.

--------------------------------------------------
TESTS (317/317 PASS)
--------------------------------------------------

Covered:

- loopback accepted
- non-loopback forbidden
- no active OA
- no cross-OA aggregation
- OA lookup failure
- all-zero success = healthy
- pending alone remains healthy
- processing + active lease remains healthy
- expired lease
- missing lease
- one job with multiple missing fields counted once
- residual lease
- reconcile job
- reconcile part
- stale armed >=60 seconds
- recent armed <60 seconds not stale
- null armedAt stale
- paused_reconcile
- any metric failure => all null/degraded
- privacy/secret exclusion
- no write/mutation
- active OA scoping
- no active OA does not run count queries

Local tests labeled:
LOCAL REPORTED evidence

No GitHub CI/status/workflow evidence.

--------------------------------------------------
CLOSURE STATUS
--------------------------------------------------

TASK_ID: MON-WP002-CLOSE
STATUS: CLOSED_PASS
ACCEPTED_REVIEW_HEAD: 5b34269397afbd9046610c366d9f0c27bf3d5532
ACCEPTED_REVIEW_RESULT: PASS

NEXT_TASK: NONE
NEXT_TASK_STATUS: AWAITING_OWNER_DIRECTION
