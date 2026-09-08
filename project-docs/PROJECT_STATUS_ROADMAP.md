# LineSync Plus — Project Status, Incident History & Development Roadmap

## 1. Executive Summary

Current roadmap truth:

- Phase 0: `CLOSED / PASS`
- Phase 1: `CLOSED / PASS`
- Phase 2: `CLOSED / PASS`
- Phase 3: `IN PROGRESS`
- Phase 4: `FUTURE`
- Phase 5: `FUTURE`

Current active work package:
**P3-WP003-PRE1 — Persistent Tags & Advanced Segmentation Definition / Gap Review (EVIDENCE-ONLY)**.

P3-WP003 implementation remains `FUTURE / NOT AUTHORIZED`.

## 2. Current Control Gate

```yaml
CONTROL_VERSION: 35
ACTIVE_WORK_PACKAGE: P3-WP003-PRE1
TASK_ID: P3-WP003-PRE1
PARENT_TASK: P3-WP002-CLOSE
AUTHORIZATION_REVISION: P3-WP003-PRE1-DEFINITION-GAP-REVIEW
STATUS: READY_FOR_CHATGPT_REVIEW
AUTHORIZE_EXECUTION: FALSE
NEXT_CANDIDATE: NONE
NEXT_CANDIDATE_STATUS: AWAITING_REVIEW
```

This gate authorizes evidence inspection/definition only, not implementation.

## 3. Accepted Phase 3 Foundation

### P3-WP001 — Customer Intelligence Foundation
Status: `CLOSED / PASS`
Accepted implementation HEAD: `f9a097a7579c1a357506816656b10c01f68be6ac`

### P3-WP002 — Outbound Activity Intelligence
Status: `CLOSED / PASS`

Accepted production implementation:
`03dd35a5d6b29c6394f93f16061bfaddb5f10174`

Accepted evidence HEAD:
`135f915726f2ab8d20d58b8b3dccd0aa38b1a1f6`

PRE1 code baseline:
`6c555a54c114cdad0aa78a43f508a5b297df6546`

The closed behavior from P3-WP001/P3-WP002 must be preserved.

## 4. P3-WP003-PRE1 Decision

### P3-WP003-PRE1 — Persistent Tags & Advanced Segmentation Definition / Gap Review
Status: `READY_FOR_CHATGPT_REVIEW`

PRE1 must establish a repository-grounded definition for:
- current persistent-data/tagging gap
- OA/global tag scope
- customer/tag cardinality and uniqueness
- normalization and rename/delete semantics
- assignment/unassignment/bulk/idempotency rules
- advanced segmentation filters
- AND/OR and tag ANY/ALL semantics
- deterministic result ordering/pagination
- OA security/isolation and fail-fast validation
- candidate API contract
- minimal UI contract
- likely schema/join/index/migration impact
- N+1 avoidance/performance approach
- backward compatibility
- future bounded implementation split
- complete test/acceptance contract

PRE1 may inspect relevant source/tests/entities/database-init/dashboard/package/docs, but no implementation file may be modified.

At successful completion only the five control docs may change and PRE1 must move to `READY_FOR_CHATGPT_REVIEW`.

### P3-WP003 — Persistent Tags & Advanced Segmentation
Status: `FUTURE / IMPLEMENTATION NOT AUTHORIZED`

No implementation, schema, endpoint, UI, migration or dependency work is authorized by PRE1.

## 5. Expected PRE1 Design Boundaries

The review should explicitly decide or flag:

1. **Tag ownership** — OA-scoped versus global, with architecture/safety justification.
2. **Persistence** — minimum tag + customer-tag data shape and required indexes, without implementing them.
3. **Semantics** — uniqueness, case/whitespace normalization, rename/delete, duplicate assignment and bulk behavior.
4. **Segmentation** — tags + blocked state + accepted WP002 activity signals such as success/failure/reconcile/latest status/recent-success/NEVER_SUCCESS.
5. **Composition** — AND/OR rules and multi-tag ANY/ALL behavior.
6. **Safety** — no cross-OA leakage, blocked-user protection, wrong-recipient fencing and safe DOM rendering.
7. **Performance** — DB-side filtering/aggregation where appropriate, deterministic ordering and no N+1.
8. **Compatibility** — preserve P3-WP001, P3-WP002, selectedUsers, stale OA discard and prior campaign/runtime contracts.
9. **Implementation split** — smallest safe future WPs, not automatically authorized.
10. **Acceptance evidence** — exact regression/security/performance tests required for eventual closure.

## 6. Runtime / Safety Contract

- Worker: `28.16`
- Required Worker: `28.16`
- Runtime Contract: `2`

PRE1 authorizes:
- repository inspection
- definition/gap analysis
- final control-doc evidence sync only

PRE1 does not authorize:
- source/test modifications
- `index.html` modifications
- schema/migration/index implementation
- package/dependency changes
- Worker changes
- LINE sends or Live UAT
- Telegram changes/tests

Permanent truth:
- true exactly-once physical LINE delivery is not guaranteed
- ambiguous physical sends must never be automatically resent

## 7. Progress Estimate

- Official accepted roadmap progress estimate: **~61%**
- Practical implementation progress estimate: **~61%**

PRE1 definition evidence does not itself increase accepted implementation progress.

## 8. Immediate Lifecycle

```text
P3-WP003-PRE1 CONTROL UPDATE
-> COMMIT/PUSH
-> STOP
-> FRESH PRE1 EXECUTION
-> evidence-only repository inspection + definition/gap review
-> five-control-doc evidence sync
-> READY_FOR_CHATGPT_REVIEW
-> COMMIT/PUSH
-> STOP
-> ChatGPT independent review
-> explicit Owner authorization required before P3-WP003 implementation
```

No later work package may auto-start.
