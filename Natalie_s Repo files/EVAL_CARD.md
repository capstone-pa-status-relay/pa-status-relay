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
