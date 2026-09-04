# EXECUTION GATE

CONTROL_VERSION: 1

TASK_ID: MON-WP002

TITLE:
Queue / Lease / Reconciliation Monitoring

STATUS:
AUTHORIZED_FOR_EXECUTION

AUTHORIZED_BY:
Project Owner

CONTROL_PLANE:
ChatGPT

EXECUTION_PLANE:
Antigravity

CANONICAL_BRANCH:
main

CODE_BASELINE_HEAD:
74359ed58c3a02dd574a78dce7f2330632e28c5b

BASELINE_POLICY:
NON_DOCUMENT_CODE_MUST_MATCH_CODE_BASELINE

If non-project-docs code changed after CODE_BASELINE_HEAD before
MON-WP002 starts:

STOP_REASON:
CODE_BASELINE_DRIFT

CONTROL_UPDATE_POLICY:
CURRENT_EXPLICIT_OWNER_CONTROL_UPDATE_ONLY

IMPORTANT:

This gate authorizes MON-WP002 implementation in a FUTURE execution run.

DO NOT execute MON-WP002 during this control update run.

After creating and pushing this control update:
STOP.

--------------------------------------------------
MON-WP002 OBJECTIVE
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
ALLOWED IMPLEMENTATION FILES
--------------------------------------------------

- src/app.controller.ts
- src/app.controller.spec.ts
- index.html

Supporting docs allowed after implementation:

- project-docs/ACTIVE_TASK.md
- project-docs/CHAT_HANDOFF.md
- project-docs/CURRENT_STATE.md
- project-docs/PROJECT_STATUS_ROADMAP.md
- project-docs/EXECUTION_GATE.md

--------------------------------------------------
PROHIBITED FILES
--------------------------------------------------

Do not modify:

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

Implement:

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

Add compact monitoring for:

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

Use polling consistent with MON-WP001.

No write/retry/reset/reconcile controls.

--------------------------------------------------
MINIMUM TESTS
--------------------------------------------------

Cover at least:

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

Run focused tests first.
Then full test suite.

Local tests must be labeled:
LOCAL REPORTED evidence

Do not claim GitHub CI unless CI actually ran.

--------------------------------------------------
AFTER MON-WP002 IMPLEMENTATION
--------------------------------------------------

Set:

STATUS:
READY_FOR_CHATGPT_REVIEW

Supporting docs:

ACTIVE_WORK_PACKAGE: MON-WP002
MON-WP001: CLOSED / PASS
MON-WP001-R1: CLOSED / PASS
MON-WP002: READY_FOR_CHATGPT_REVIEW
PHASE_0: CLOSED / PASS
PHASE_1: IN PROGRESS
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: PENDING_REVIEW

Record:

- code baseline
- Worker 28.16 unchanged
- Runtime Contract 2 unchanged
- no Live LINE UAT
- focused tests
- full-suite tests
- local evidence status
- exact changed files

Commit message for MON-WP002:

ops: add queue lease reconciliation monitoring

Push origin main.

Fetch origin.

Prove:

- HEAD
- origin/main
- HEAD == origin/main
- working tree clean
- exact changed files

STOP.

Do not start MON-WP003.
