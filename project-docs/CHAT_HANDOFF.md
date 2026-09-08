# CHAT HANDOFF

## Repository
- Repository: `rebootob/line-sync-plus`
- Canonical Branch: `main`
- Current control version: `37`
- Worker Version: `28.16`
- Required Worker Version: `28.16`
- Runtime Contract Version: `2`

## Roles
- Project Owner = final human authority
- ChatGPT = Control Plane / Project Lead / Architect / Independent Reviewer
- Antigravity = bounded Execution Plane only
- Repository truth is authoritative

## Current State
- Phase 0: `CLOSED / PASS`
- Phase 1: `CLOSED / PASS`
- Phase 2: `CLOSED / PASS`
- Phase 3: `IN PROGRESS`
- P3-WP001: `CLOSED / PASS`
- P3-WP002: `CLOSED / PASS`
- P3-WP003-PRE1: `CORRECTIVE REQUIRED / SUPERSEDED`
- P3-WP003-PRE1-R1: `CORRECTIVE REQUIRED / SUPERSEDED_BY_R2`
- P3-WP003-PRE1-R2: `READY_FOR_CHATGPT_REVIEW`
- P3-WP003: `FUTURE / IMPLEMENTATION NOT AUTHORIZED`
- ACTIVE_WORK_PACKAGE: `P3-WP003-PRE1-R2`
- AUTHORIZE_EXECUTION: `FALSE`

## Why R2 Exists

R1 successfully added A-J repository findings, but independent review found factual mismatches against current source plus unresolved normative choices. R2 is limited to contract accuracy and decision closure.

Required corrections include:
1. Current Customer truth must match `src/customer.entity.ts`, especially `isBlocked`; do not invent a current status enum field.
2. Current `/api/customers` backend truth must match source; current endpoint is OA-scoped by `botId` and active-OA fencing and must not be described as already supporting backend search/status filters unless source proves it.
3. Preserve accepted WP002 names: `successfulJobCount`, `lastSuccessfulSendAt`, `failedJobCount`, `reconcileRequiredCount`, `latestJobStatus`, `latestJobCreatedAt`.
4. Close every normative ambiguity with one explicit rule.
5. Complete future API status/response/idempotency semantics.
6. Define WP1/WP2/WP3 purpose, allowed files, exclusions and acceptance boundaries.
7. Include missing tests for ordering/pagination, `isBlocked`, selectedUsers and explicit AND/OR composition.
8. Sync all five control docs to completion truth.

## Strict Scope

R2 is EVIDENCE-ONLY. No source/test/schema/UI/package/runtime implementation is authorized. At completion only the five project control docs may change.

## Safety

Preserve OA isolation, wrong-recipient fencing, blocked-user protection, selectedUsers behavior, stale-OA discard, safe DOM handling, send ambiguity fencing and all accepted Phase 0-2 behavior.

True exactly-once physical LINE delivery remains NOT GUARANTEED. Never automatically resend an ambiguous physical send.

## Progress
- Official accepted: ~61%
- Practical implementation: ~61%

R2 does not itself increase implementation progress. After R2 completion, stop for ChatGPT independent review. Do not auto-start P3-WP003.
