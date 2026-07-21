# Regression Test Cases — PA Status Relay

Aligned to the exact transition table in Engineering Spec Section 3a, not the condensed PRD summary. Priority tags match PRD Section 3.

## Case management

| # | Case | Steps | Expected result | Priority |
|---|---|---|---|---|
| 1 | Case list loads with key metadata | Load case list | Patient name, status, timestamp, consent flag visible per row | P0 |
| 2 | Search/filter/sort | Search by patient name; filter by status; sort by date | Results update correctly | P0 |
| 3 | Create case, required fields enforced | Attempt creation with patient name blank | Blocked, inline error | P0 |
| 4 | Create case, valid input | Fill patient name + consent flag, submit | Case created, status `new_order` | P0 |
| 5 | Edit existing case metadata | Open case, change optional metadata, save | Change persists | P1 |

## Status transitions — exact map (Engineering Spec 3a)

| # | Transition | Pre-condition | Priority |
|---|---|---|---|
| 6 | `new_order` → `needs_documentation` | None | P0 |
| 7 | `new_order` → `submitted` | `doc_link` required | P0 |
| 8 | `needs_documentation` → `submitted` | `doc_link` required | P0 |
| 9 | `submitted` → `pending_review` | None | P0 |
| 10 | `submitted` → `needs_documentation` (amber return) | `reason_code` required | P0 |
| 11 | `pending_review` → `approved` | None | P0 |
| 12 | `pending_review` → `denied` | `reason_code` required | P0 |
| 13 | `pending_review` → `info_request` | `reason_code` required | P0 |
| 14 | `pending_review` → `peer_to_peer` | None | P0 |
| 15 | `info_request` → `pending_review` | `reason_code` required | P0 |
| 16 | `info_request` → `submitted` (re-submit) | `doc_link` required | P0 |
| 17 | `peer_to_peer` → `pending_review` | `reason_code` required | P0 |
| 18 | `approved` → `closed` | `appointment_link` required | P0 |
| 19 | `denied` → `closed` | `next_step_note` required | P0 |

## MVP constraints, enforced at API level, not just UI (Engineering Spec 3a)

| # | Case | Expected result | Priority |
|---|---|---|---|
| 20 | `peer_to_peer` → `approved` | Returns `400 invalid_transition` | P0 |
| 21 | `peer_to_peer` → `denied` | Returns `400 invalid_transition` | P0 |
| 22 | `denied` → `submitted` | Returns `400 invalid_transition` (no appeal path in MVP) | P0 |
| 23 | `closed` → any status | Returns `400 invalid_transition` (terminal state) | P0 |

## Error code verification (Engineering Spec 3b)

| # | Trigger | Expected error | Priority |
|---|---|---|---|
| 24 | Transition not in valid map | `400 invalid_transition` | P0 |
| 25 | Missing `doc_link` where required | `400 missing_doc_link` | P0 |
| 26 | Missing `reason_code` where required | `400 missing_reason_code` | P0 |
| 27 | Missing `appointment_link` on approved → closed | `400 missing_appointment` | P0 |
| 28 | Missing `next_step_note` on denied → closed | `400 missing_next_step` | P0 |
| 29 | Attempted edit/delete on audit_trail | `403 audit_immutable` | P0 |
| 30 | Unauthenticated request | `401 unauthorized` | P0 |
| 31 | Error response shape | Every error returns `{ "error": "...", "message": "..." }` exactly | P0 |

## Audit entry content and timing

| # | Case | Expected result | Priority |
|---|---|---|---|
| 32 | Audit row fields | Every row includes `id, case_id, from_status, to_status, actor_id, actor_label, timestamp, reason_code, doc_link, message_sent, message_text, message_custom` | P0 |
| 33 | Audit entry latency | Appears within 500ms of successful transition (via refetch, not realtime) | P0 |
| 34 | Reverse chronological order | Most recent entry displays first | P0 |

## Patient message preview

| # | Case | Steps | Expected result | Priority |
|---|---|---|---|---|
| 35 | Preview shown, consent TRUE | Complete a status change | Modal shows message + channel label; confirm sets `message_sent = TRUE` | P0 |
| 36 | Preview suppressed, consent FALSE | Complete a status change | Send disabled; label "Consent required — record consent to enable message delivery"; `message_suppressed` audit event logged; `message_sent = FALSE` | P0 |
| 37 | Custom message flag | Edit templated text, confirm | `message_custom = TRUE` on that audit row | P1 |
| 38 | Consent FALSE → TRUE mid-case | Change consent flag mid-case | No retroactive send for prior transitions; message sends only on the next transition | P0 |
| 39 | No jargon in templates | Review all 9 message strings against Appendix C | Zero clinical abbreviations, payer jargon, or reference numbers; Denied message has no denial rationale | P0 |

## Audit trail integrity

| # | Case | Expected result | Priority |
|---|---|---|---|
| 40 | UI-level immutability | No edit/delete controls rendered on any audit row | P0 |
| 41 | API-level immutability | No PUT/PATCH/DELETE endpoint exists; direct call returns `403 audit_immutable` | P0 |
| 42 | RLS-level immutability | Direct UPDATE/DELETE against `audit_trail` denied by policy, independent of the API | P0 |
| 43 | Filter without reload | Filter by actor, action type, or date range, client-side only | P0 |
| 44 | CSV export | Filename `audit_{case_id}_{YYYY-MM-DD}.csv`; columns in order: `timestamp, actor_label, action, from_status, to_status, reason_code, message_sent, message_custom` | P1 |
| 45 | Demo events excluded from export | No `demo_events` rows appear in the audit CSV | P0 |

## Demo controls

| # | Case | Expected result | Priority |
|---|---|---|---|
| 46 | Reset | Confirmation toast shown; case restored to seeded baseline; audit_trail rows NOT cleared; `demo_events` row written (`event_type = reset`) | P0 |
| 47 | Clone | New case created, `status = new_order`, empty audit trail, copies `patient_name` + `consent_flag`; source case gets `demo_events` row (`event_type = clone`); frontend navigates to new case immediately | P0 |
| 48 | Re-open | Does not change case status (closed is terminal); `demo_events` row written (`event_type = reopen`); UI shows "Demo only" label | P1 |

## End-to-end scenario coverage (5 seed cases, Engineering Spec 2e)

| # | Case | Expected result | Priority |
|---|---|---|---|
| 49 | Case 1 (new_order, consent TRUE) | Full happy path completes | P0 |
| 50 | Case 2 (needs_documentation, consent TRUE) | Docs-missing metadata enforcement | P0 |
| 51 | Case 3 (pending_review, consent FALSE) | Consent gating and suppression | P0 |
| 52 | Case 4 (info_request, consent TRUE) | Both Info Request exits work | P0 |
| 53 | Case 5 (peer_to_peer, consent TRUE) | P2P constraint holds at API level | P0 |
| 54 | Aggregate | 100% of 5 scenarios complete error-free, median time ≤90s | P0 |
