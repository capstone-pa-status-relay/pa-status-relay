# Eval Card — PA Status Relay

Pass/fail instrument for reviewer sign-off, aligned to the 5 real seed cases (Engineering Spec 2e) and scenario scripts (`QA_SCENARIOS.md`, authoritative for exact steps). This card summarizes pass criteria against the stated success metrics; for full step-by-step scripts, tooltips, and exact button states, use `QA_SCENARIOS.md` directly.

## Scenario 1 — Full happy path (Case 1: `new_order`, consent TRUE)

New Order → Needs Documentation/Submitted → Pending Review → Approved → Closed.

**Pass criteria:** every transition writes an audit row within 500ms; message preview appears at every step with exact Appendix C copy; Approved → Closed blocked until `appointment_link` present; CSV exports correctly (5 rows, no demo_event rows); total time ≤90 seconds.

## Scenario 2 — Docs missing at intake (Case 2: `needs_documentation`, consent TRUE)

Blocked transition to Submitted until `doc_link` supplied; amber return (Submitted → Needs Documentation) requires `reason_code`.

**Pass criteria:** inline error fires correctly and clears once the required field is supplied; amber return path enforces `reason_code`.

## Scenario 3 — Consent gating (Case 3: `pending_review`, consent FALSE)

Transition to Approved with consent FALSE, then flip consent to TRUE and transition to Closed.

**Pass criteria:** send button disabled while consent FALSE; `message_suppressed` audit event logged; no retroactive send when consent flips to TRUE, only the next transition sends.

## Scenario 4 — Payer info request branch (Case 4: `info_request`, consent TRUE)

Both exits from Info Request tested (→ Pending Review, → Submitted re-submit), plus Reset.

**Pass criteria:** both exits enforce their required field (`reason_code`, `doc_link`); Reset restores baseline without clearing audit trail; `demo_events` row written on reset, not the audit trail.

## Scenario 5 — Peer-to-peer constraint (Case 5: `peer_to_peer`, consent TRUE)

Confirm P2P → Approved/Denied blocked at API level, not just UI; then Clone.

**Pass criteria:** direct API call to an invalid P2P transition returns `400 invalid_transition`; Clone creates an independent case with empty audit trail and doesn't affect the source case's trail.

## Aggregate pass bar (PRD 2d)

| Metric | Target | Result |
|---|---|---|
| Scenarios completed error-free | 100% (5 of 5) | — |
| Median time, open case → audit entry | ≤90 seconds | — |
| Patient messages passing plain-language review | ≥95% | — |
| Reviewers rating demo "useful/feasible" | ≥80% | — |

Any scenario that fails should be logged as a known issue with an owner and fix plan before Day 5, not silently re-attempted until it passes.

## Run Results

| Date | Branch | Case | Result | Evidence |
|---|---|---|---|---|
| 2026-07-24 | chore/day-2-evening-acmappng-regression-test | Case 1 - Golden (valid transition via real UI) | FAIL (not executable end-to-end) | Live UI had no case rows due missing Supabase env and fetch skipped ([src/lib/supabase.ts](src/lib/supabase.ts#L3), [src/lib/supabase.ts](src/lib/supabase.ts#L6), [src/App.tsx](src/App.tsx#L1637)); Create Case did not persist and only logged ([src/App.tsx](src/App.tsx#L1740), [src/App.tsx](src/App.tsx#L1741)); transition route depends on `/api` call path ([src/App.tsx](src/App.tsx#L1709)). |
| 2026-07-24 | chore/day-2-evening-acmappng-regression-test | Case 2 - Edge (consent=false warning + send blocked) | FAIL (blocked by missing live consent-false case) | No seeded/live case list available in UI because fetch skipped ([src/App.tsx](src/App.tsx#L1637)); modal consent state derives from selected case and defaults true when none selected ([src/App.tsx](src/App.tsx#L2250)); could not execute consent-false path on live case. |
| 2026-07-24 | chore/day-2-evening-acmappng-regression-test | Case 3 - Adversarial (invalid transition via direct call) | FAIL (expected contract 400 invalid_transition, observed HTTP 404) | Direct POST to `http://127.0.0.1:5173/api/cases/invalid-case-id/transition` returned 404 (captured terminal output); dev server config has no API proxy/routes ([vite.config.ts](vite.config.ts#L5)); UI still issues `/api` fetches ([src/App.tsx](src/App.tsx#L1709)). |
| 2026-07-25 | chore/day-2-evening-acmappng-regression-test | Step 1 - Live DB precheck after PR #25 | FAIL (seed prerequisite missing) | Read-only Supabase query returned `CASES_COUNT 0` (captured terminal output). PR #25 implemented Supabase repository queries ([src/backend/supabaseRepository.ts](src/backend/supabaseRepository.ts#L190), [src/backend/supabaseRepository.ts](src/backend/supabaseRepository.ts#L193)), but seeding remains manual SQL execution: run schema in Supabase SQL Editor ([supabase/schema.sql](supabase/schema.sql#L7)), then run seed script in the same SQL Editor ([supabase/seed.sql](supabase/seed.sql#L3), [supabase/seed.sql](supabase/seed.sql#L11)). |
| 2026-07-25 | chore/day-2-evening-acmappng-regression-test | Case 1 - Golden (valid transition via real UI, persistence across refresh) | BLOCKED | No live rows in case list (empty-state rendered in app) and `cases` table count is 0 (captured terminal output); cannot execute real transition/audit persistence checks until seed data exists. |
| 2026-07-25 | chore/day-2-evening-acmappng-regression-test | Case 2 - Edge (consent=false path, message_suppressed/no_consent) | BLOCKED | No consent-false live case available because live `cases` table is empty (`CASES_COUNT 0`, captured terminal output); PR #20 behavior cannot be verified in live UI/API until seeded rows exist. |
| 2026-07-25 | chore/day-2-evening-acmappng-regression-test | Case 3 - Adversarial (invalid transition should return 400 invalid_transition) | BLOCKED | Adversarial invalid-transition test requires an existing seeded case to distinguish `invalid_transition` from `case_not_found`; live `cases` table currently empty (`CASES_COUNT 0`, captured terminal output). |
