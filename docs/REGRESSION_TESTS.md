# Regression Test Specifications — PA Status Relay

**Status:** Pre-implementation, test-first specification. These tests are planned but have not yet been implemented, executed, or passed.

Aligned to the transition contract in `STATE_MACHINE.md` and traced to PRD Section 3. Priority tags identify release importance; they do not indicate execution status.

## Test status model

- **Specified:** Written here with a defined expected result.
- **Implemented:** Converted into executable code or a formal manual procedure.
- **Executed:** Run against a named build and environment.
- **Passed/Failed:** Result recorded with evidence.
- **Blocked:** Cannot be finalized until a documented ambiguity is resolved.

## Case management

| # | Case | Steps | Expected result | Priority |
|---|---|---|---|---|
| TC-001 | Case list loads with key metadata | Load case list | Patient name, status, timestamp, consent flag visible per row | P0 |
| TC-002 | Search/filter/sort | Search by patient name; filter by status; sort by date | Results update correctly | P0 |
| TC-003 | Create case, required fields enforced | Attempt creation with patient name blank | Blocked, inline error | P0 |
| TC-004 | Create case, valid input | Fill patient name + consent flag, submit | Case created, status `new_order` | P0 |
| TC-005 | Edit existing case metadata | Open case, change optional metadata, save | Change persists | P1 |

## Status transitions — exact map (`STATE_MACHINE.md`)

**Shared contract for TC-006 through TC-019:** With every required precondition supplied, the API returns HTTP 200, the case changes to the target status, the UI displays the target status, and exactly one finalized immutable transition record is created with the correct case, actor, previous status, new status, timestamp, and final message fields. No unrelated case changes. If a required precondition is absent, the API returns the specified HTTP 400 error, the case remains in its starting status, and no transition audit row is created.

| # | Transition | Pre-condition | Priority |
|---|---|---|---|
| TC-006 | `new_order` → `needs_documentation` | None | P0 |
| TC-007 | `new_order` → `submitted` | `doc_link` required | P0 |
| TC-008 | `needs_documentation` → `submitted` | `doc_link` required | P0 |
| TC-009 | `submitted` → `pending_review` | None | P0 |
| TC-010 | `submitted` → `needs_documentation` (amber return) | `reason_code` required | P0 |
| TC-011 | `pending_review` → `approved` | None | P0 |
| TC-012 | `pending_review` → `denied` | `reason_code` required | P0 |
| TC-013 | `pending_review` → `info_request` | `reason_code` required | P0 |
| TC-014 | `pending_review` → `peer_to_peer` | None | P0 |
| TC-015 | `info_request` → `pending_review` | `reason_code` required | P0 |
| TC-016 | `info_request` → `submitted` (re-submit) | `doc_link` required | P0 |
| TC-017 | `peer_to_peer` → `pending_review` | `reason_code` required | P0 |
| TC-018 | `approved` → `closed` | `appointment_link` required | P0 |
| TC-019 | `denied` → `closed` | `next_step_note` required | P0 |

## MVP constraints, enforced at API level, not just UI (`STATE_MACHINE.md`)

| # | Case | Expected result | Priority |
|---|---|---|---|
| TC-020 | `peer_to_peer` → `approved` | Returns `400 invalid_transition` | P0 |
| TC-021 | `peer_to_peer` → `denied` | Returns `400 invalid_transition` | P0 |
| TC-022 | `denied` → `submitted` | Returns `400 invalid_transition` (no appeal path in MVP) | P0 |
| TC-023 | `closed` → any status | Returns `400 invalid_transition` (terminal state) | P0 |

## Error code verification (`STATE_MACHINE.md`)

| # | Trigger | Expected error | Priority |
|---|---|---|---|
| TC-024 | Transition not in valid map | `400 invalid_transition` | P0 |
| TC-025 | Missing `doc_link` where required | `400 missing_doc_link` | P0 |
| TC-026 | Missing `reason_code` where required | `400 missing_reason_code` | P0 |
| TC-027 | Missing `appointment_link` on approved → closed | `400 missing_appointment` | P0 |
| TC-028 | Missing `next_step_note` on denied → closed | `400 missing_next_step` | P0 |
| TC-029 | Attempted edit/delete on audit_trail | `403 audit_immutable` | P0 |
| TC-030 | Unauthenticated request | `401 unauthorized` | P0 |
| TC-031 | Error response shape | Every error returns `{ "error": "...", "message": "..." }` exactly | P0 |

## Audit entry content and timing

| # | Case | Expected result | Priority |
|---|---|---|---|
| TC-032 | Audit row fields | Every row includes `id, case_id, action, from_status, to_status, actor_id, actor_label, timestamp, reason_code, doc_link, message_sent, message_text, message_custom` | P0 |
| TC-033 | Audit entry latency | Appears within 500ms of successful transition (via refetch, not realtime) | P0 |
| TC-034 | Audit display order | **BLOCKED — A-05:** verify whether the authoritative requirement is oldest-first or most-recent-first before finalizing the expected result | P0 |

## Patient message preview

| # | Case | Steps | Expected result | Priority |
|---|---|---|---|---|
| TC-035 | Preview shown, consent TRUE | Select a valid target status | Modal shows message + channel label; final transition/message sequence follows the team decision in A-06/A-07; finalized audit evidence records `message_sent = TRUE` | P0 |
| TC-036 | Preview suppressed, consent FALSE | Select a valid target status | Send disabled; label "Consent required — record consent to enable message delivery"; suppression evidence follows the team decision in A-08; finalized transition evidence records `message_sent = FALSE` | P0 |
| TC-037 | Custom message flag | Edit templated text, confirm | `message_custom = TRUE` on that audit row | P1 |
| TC-038 | Consent FALSE → TRUE mid-case | Change consent flag mid-case | No retroactive send for prior transitions; message sends only on the next transition | P0 |
| TC-039 | No jargon in templates | Review all 9 message strings against Appendix C | Zero clinical abbreviations, payer jargon, or reference numbers; Denied message has no denial rationale | P0 |

## Audit trail integrity

| # | Case | Expected result | Priority |
|---|---|---|---|
| TC-040 | UI-level immutability | No edit/delete controls rendered on any audit row | P0 |
| TC-041 | API-level immutability | **BLOCKED — A-10:** team must choose either no mutation route (`404/405`) or an explicit rejecting route (`403 audit_immutable`) | P0 |
| TC-042 | RLS-level immutability | Direct UPDATE/DELETE against `audit_trail` denied by policy, independent of the API | P0 |
| TC-043 | Filter without reload | Filter by actor, action type, or date range, client-side only | P0 |
| TC-044 | CSV export | Filename `audit_{case_id}_{YYYY-MM-DD}.csv`; columns in order: `timestamp, actor_label, action, from_status, to_status, reason_code, message_sent, message_custom` | P1 |
| TC-045 | Demo events excluded from export | No `demo_events` rows appear in the audit CSV | P0 |

## Demo controls

| # | Case | Expected result | Priority |
|---|---|---|---|
| TC-046 | Reset | **BLOCKED — A-09/Q3:** confirmation is required and a `demo_events` row is written; exact baseline restoration behavior is finalized after the Reset strategy is logged in `DECISIONS.md` | P0 |
| TC-047 | Clone | New case created, `status = new_order`, empty audit trail, copies `patient_name` + `consent_flag`; source case gets `demo_events` row (`event_type = clone`); frontend navigates to new case immediately | P0 |
| TC-048 | Re-open | Does not change case status (closed is terminal); `demo_events` row written (`event_type = reopen`); UI shows "Demo only" label | P1 |

| TC-055 | UI transition controls | For every starting status, all transition choices remain visible; valid choices are enabled, invalid or gated choices are disabled, and each disabled choice has a specific explanation | P0 |
| TC-056 | Clone independence replay | Run a transition sequence on a clone, then reopen the source case; source status and source audit trail remain unchanged | P1 |
| TC-057 | Message skip behavior | **BLOCKED — A-07:** verify the approved status/audit result when the coordinator skips or closes the message step | P0 |

## End-to-end scenario coverage (5 seed cases)

| # | Case | Expected result | Priority |
|---|---|---|---|
| TC-049 | Case 1 (new_order, consent TRUE) | Full happy path completes | P0 |
| TC-050 | Case 2 (needs_documentation, consent TRUE) | Docs-missing metadata enforcement | P0 |
| TC-051 | Case 3 (pending_review, consent FALSE) | Consent gating and suppression | P0 |
| TC-052 | Case 4 (info_request, consent TRUE) | Both Info Request exits work | P0 |
| TC-053 | Case 5 (peer_to_peer, consent TRUE) | P2P constraint holds at API level | P0 |
| TC-054 | Aggregate scenario completion | 100% of 5 scenarios complete error-free | P0 |
| TC-058 | Coordinator workflow timing | Median measured time from opening a case to finalized audit evidence is ≤90 seconds across the agreed test runs | P0 |

## Execution record

No test in this document may be marked Passed until it has been implemented or converted into a formal manual procedure, executed against an identified build, and supported by recorded evidence.
