# STATE_MACHINE.md — PA Status Relay

Authoritative reference for all valid PA status transitions, pre-condition gates, invalid transitions, and patient-facing message mappings. Both the API (Codex) and the UI (Claude Code) enforce this. If there is ever a discrepancy between this file and any other document, this file wins.

**Do not modify this file without sign-off from the backend dev and frontend dev. Changes here cascade to the API, the UI button logic, the audit trail, and the message preview modal simultaneously.**

---

## Status Enum

Nine values. Use these exact strings everywhere — in the Postgres enum, in API request/response bodies, in frontend state, and in any display logic. A mismatch between layers breaks transition validation silently.

```
new_order
needs_documentation
submitted
pending_review
info_request
peer_to_peer
approved
denied
closed
```

---

## Valid Transition Map

This is the complete set of allowed transitions. Any transition not in this table is invalid and must return HTTP 400 at the API level and render as a disabled button in the UI.

```
From                  → To                      Pre-condition / gate
─────────────────────────────────────────────────────────────────────
new_order             → needs_documentation      None
new_order             → submitted                doc_link required
needs_documentation   → submitted                doc_link required
submitted             → pending_review           None
submitted             → needs_documentation      reason_code required (amber return path)
pending_review        → approved                 None
pending_review        → denied                   reason_code required
pending_review        → info_request             reason_code required
pending_review        → peer_to_peer             None
info_request          → pending_review           reason_code required
info_request          → submitted                doc_link required (re-submit)
peer_to_peer          → pending_review           reason_code required
approved              → closed                   appointment_link required
denied                → closed                   next_step_note required
```

---

## Pre-Condition Gates (expanded)

| Transition | Required field | Error code if missing | Error message |
|---|---|---|---|
| new_order → submitted | doc_link | missing_doc_link | Documentation required before submission. Attach a file or link to continue. |
| needs_documentation → submitted | doc_link | missing_doc_link | Documentation required before submission. Attach a file or link to continue. |
| info_request → submitted | doc_link | missing_doc_link | Documentation required before re-submission. Attach a file or link to continue. |
| submitted → needs_documentation | reason_code | missing_reason_code | A reason code is required for this return path. |
| pending_review → denied | reason_code | missing_reason_code | A reason code is required for denial transitions. |
| pending_review → info_request | reason_code | missing_reason_code | A reason code is required for info request transitions. |
| info_request → pending_review | reason_code | missing_reason_code | A reason code is required to return to pending review. |
| peer_to_peer → pending_review | reason_code | missing_reason_code | A reason code is required to return to pending review. |
| approved → closed | appointment_link | missing_appointment | An appointment link is required to close an approved case. |
| denied → closed | next_step_note | missing_next_step | A next-step note is required to close a denied case. |

---

## MVP Constraints (hard blocks — enforce at API level, not just UI)

These transitions are explicitly invalid in MVP scope. They must return HTTP 400 regardless of what the UI allows.

| Transition | Error | Reason |
|---|---|---|
| peer_to_peer → approved | invalid_transition | Direct P2P resolution deferred to v2 |
| peer_to_peer → denied | invalid_transition | Direct P2P resolution deferred to v2 |
| denied → submitted | invalid_transition | Appeal path deferred to v2 |
| closed → [any status] | invalid_transition | Terminal state — no exit |

---

## Error Response Shape

All API errors use this shape consistently. Do not invent a new format.

```json
{
  "error": "error_code",
  "message": "Human-readable string for inline display."
}
```

Full error code list:
- `invalid_transition`
- `missing_doc_link`
- `missing_reason_code`
- `missing_appointment`
- `missing_next_step`
- `audit_immutable`
- `unauthorized`

---

## UI Enforcement Rules

- Invalid transitions render as **disabled buttons** (not hidden) — reviewers should see the full set of possible actions.
- Tooltip on a disabled button explains why: e.g., "Attach documentation to submit."
- UI disabling is a UX guard. The API 400 is the real guard. Both must be present.
- Feed this transition table directly into Claude Code as a prompt input when building state machine button logic. Do not rely on it inferring the transitions from context.

---

## Patient-Facing Message Map

Locked copy. Do not paraphrase, shorten, or reword in code. No clinical abbreviations, payer jargon, or authorization reference numbers may appear in any patient-facing string. The Denied message must not include denial reason code or clinical rationale. `[office #]` is a placeholder — leave as-is for demo.

| Internal status | Patient-facing message |
|---|---|
| new_order | We've received your treatment order. We'll update you as we make progress. |
| needs_documentation | Your care team is preparing everything needed for insurance review. |
| submitted | Your PA request has been submitted and is under insurance review. |
| pending_review | Your insurance is reviewing your request. We'll contact you when there's a decision. |
| info_request | We're sending additional information to your insurer. |
| peer_to_peer | A clinical discussion has been requested by your insurance provider. |
| approved | Your treatment is approved. Scheduling will contact you next. |
| closed | Your authorization case is complete. For questions, contact [office #]. |
| denied | Your insurance did not approve your request. Your care team will discuss next steps. |

---

## Display Labels (UI)

Internal enum values map to these display strings in the UI. Keep them consistent across status chips, filter dropdowns, and audit trail entries.

| Internal value | Display label |
|---|---|
| new_order | New Order |
| needs_documentation | Needs Documentation |
| submitted | Submitted |
| pending_review | Pending Review |
| info_request | Info Request |
| peer_to_peer | Peer-to-Peer |
| approved | Approved |
| denied | Denied |
| closed | Closed |

---

*STATE_MACHINE.md · v1.0 · July 2026 · Changes require backend dev + frontend dev sign-off*
