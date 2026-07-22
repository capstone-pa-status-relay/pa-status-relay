# API Contract

Backend contract for PA Status Relay. This file is a planning artifact for the API layer and should stay aligned with `STATE_MACHINE.md`, `BUILD_CHECKLIST.md`, `QA_SCENARIOS.md`, and locked team decisions.

## Sources Of Truth

- `STATE_MACHINE.md`: status enum, valid transitions, pre-condition gates, error codes, patient-facing message copy
- `BUILD_CHECKLIST.md`: day-by-day backend deliverables
- `QA_SCENARIOS.md`: scenario behavior the demo must pass
- `DECISIONS.md`: locked decisions and unresolved questions

If this file conflicts with `STATE_MACHINE.md`, `STATE_MACHINE.md` wins.

## Conventions

- All responses are JSON unless CSV export is requested.
- All errors use the shared error shape:

```json
{
  "error": "error_code",
  "message": "Human-readable string for inline display."
}
```

- No endpoint accepts, stores, or returns PHI.
- Auth uses Supabase email/password. Unauthenticated requests return `401`.
- Authorization failures return `403` with `unauthorized` unless a more specific error is defined.
- `actor_id` is the user identifier used for audit records. Do not use `user_id` in API contracts unless the schema decision changes.
- Audit rows are append-only. No endpoint may update or delete `audit_trail` rows.
- Demo controls write to `demo_events`, not `audit_trail`.

## Status Values

Use exactly these status strings:

```text
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

## Transition Commit Contract

The transition endpoint is the commit point for status changes.

Locked frontend/backend flow:

- StatusDrawer "Confirm and send" opens the Message Preview Modal.
- The coordinator confirms in the Modal.
- `POST /api/cases/:id/transition` fires after Modal confirmation with all status, metadata, and message fields.
- StatusDrawer "Log status only" bypasses the Modal and calls `POST /api/cases/:id/transition` directly with `message_sent = false`.
- Status chip and audit trail update only after a successful transition response.
- The inline StatusDrawer message preview is read-only.
- The Modal is the editable confirmation step for patient-facing message text.

## Data Shapes

### Case Summary

```json
{
  "id": "case_001",
  "patient_name": "Mock Patient",
  "status": "new_order",
  "consent_flag": true,
  "updated_at": "2026-07-21T15:00:00Z"
}
```

### Case Detail

```json
{
  "id": "case_001",
  "patient_name": "Mock Patient",
  "status": "new_order",
  "consent_flag": true,
  "doc_link": null,
  "appointment_link": null,
  "next_step_note": null,
  "created_at": "2026-07-21T15:00:00Z",
  "updated_at": "2026-07-21T15:00:00Z"
}
```

Final field names must match Lebert's Supabase schema once locked.

### Audit Entry

```json
{
  "id": "audit_001",
  "case_id": "case_001",
  "timestamp": "2026-07-21T15:00:00Z",
  "actor_id": "auth_user_id",
  "actor_label": "Demo Coordinator",
  "action": "status_transition",
  "from_status": "new_order",
  "to_status": "submitted",
  "reason_code": null,
  "message_sent": true,
  "message_custom": false
}
```

### Demo Event

Supabase stores demo event time as `timestamp`; API responses expose it as `created_at`.

```json
{
  "id": "event_001",
  "case_id": "case_001",
  "event_type": "reset",
  "actor_id": "auth_user_id",
  "actor_label": "Demo Coordinator",
  "created_at": "2026-07-21T15:00:00Z"
}
```

## Endpoints

### `GET /api/cases`

Returns case summaries for the case list.

Query parameters:

- `status` optional status filter
- `sort` optional sort field, expected `updated_at`
- `order` optional, `asc` or `desc`

Response `200`:

```json
{
  "cases": [
    {
      "id": "case_001",
      "patient_name": "Mock Patient",
      "status": "new_order",
      "consent_flag": true,
      "updated_at": "2026-07-21T15:00:00Z"
    }
  ]
}
```

### `POST /api/cases`

Creates a mock PA case.

Request:

```json
{
  "patient_name": "Mock Patient",
  "consent_flag": true,
  "doc_link": null
}
```

Response `201`:

```json
{
  "case": {
    "id": "case_001",
    "patient_name": "Mock Patient",
    "status": "new_order",
    "consent_flag": true,
    "doc_link": null,
    "appointment_link": null,
    "next_step_note": null,
    "created_at": "2026-07-21T15:00:00Z",
    "updated_at": "2026-07-21T15:00:00Z"
  }
}
```

### `GET /api/cases/:id`

Returns a single case detail.

Response `200`:

```json
{
  "case": {
    "id": "case_001",
    "patient_name": "Mock Patient",
    "status": "new_order",
    "consent_flag": true,
    "doc_link": null,
    "appointment_link": null,
    "next_step_note": null,
    "created_at": "2026-07-21T15:00:00Z",
    "updated_at": "2026-07-21T15:00:00Z"
  }
}
```

### `PATCH /api/cases/:id/consent`

Updates the case consent flag. This does not retroactively send messages or modify prior audit rows. Any prior transition with `message_sent = false` remains unchanged; message delivery can only happen on a later transition.

Request:

```json
{
  "consent_flag": true
}
```

Response `200`:

```json
{
  "case": {
    "id": "case_001",
    "status": "pending_review",
    "consent_flag": true,
    "updated_at": "2026-07-21T15:00:00Z"
  }
}
```

Required behavior:

- `consent_flag` is required and must be boolean.
- Return `400 missing_consent_flag` if absent or invalid.
- Do not write to `audit_trail` for prior messages.
- Do not retroactively send messages for prior status changes.

### `POST /api/cases/:id/transition`

Commits a status transition and writes an audit row.

Request:

```json
{
  "to_status": "submitted",
  "doc_link": "https://example.test/mock-doc",
  "reason_code": null,
  "appointment_link": null,
  "next_step_note": null,
  "message_text": "Your PA request has been submitted and is under insurance review.",
  "message_sent": true,
  "message_custom": false
}
```

For "Log status only", send:

```json
{
  "to_status": "submitted",
  "doc_link": "https://example.test/mock-doc",
  "message_text": null,
  "message_sent": false,
  "message_custom": false
}
```

Required behavior:

- Validate `to_status` against `STATE_MACHINE.md`.
- Validate the transition from the current stored status.
- Enforce all pre-condition gates from `STATE_MACHINE.md`.
- Write one immutable `audit_trail` row on success.
- Update the case status only after validation succeeds.
- Return `400 invalid_transition` for every transition not in the valid map.
- Return the named missing-field error code for missing required metadata.
- Consent false must result in `message_sent = false`; no patient-facing message should be recorded as sent.

Response `200`:

```json
{
  "case": {
    "id": "case_001",
    "status": "submitted",
    "updated_at": "2026-07-21T15:00:00Z"
  },
  "audit_entry": {
    "id": "audit_001",
    "case_id": "case_001",
    "timestamp": "2026-07-21T15:00:00Z",
    "actor_id": "auth_user_id",
    "actor_label": "Demo Coordinator",
    "action": "status_transition",
    "from_status": "new_order",
    "to_status": "submitted",
    "reason_code": null,
    "message_sent": true,
    "message_custom": false
  }
}
```

### `GET /api/cases/:id/audit`

Returns audit entries for one case.

Query parameters:

- `actor_id` optional
- `action_type` optional
- `date_from` optional ISO date or timestamp
- `date_to` optional ISO date or timestamp

Response `200`:

```json
{
  "audit": [
    {
      "id": "audit_001",
      "case_id": "case_001",
      "timestamp": "2026-07-21T15:00:00Z",
      "actor_id": "auth_user_id",
      "actor_label": "Demo Coordinator",
      "action": "status_transition",
      "from_status": "new_order",
      "to_status": "submitted",
      "reason_code": null,
      "message_sent": true,
      "message_custom": false
    }
  ]
}
```

Default ordering: reverse chronological, most recent first. This is locked in D12 in `docs/DECISIONS.md`, so the frontend can render the default audit response without applying its own sort.

### `GET /api/cases/:id/audit/export`

Returns CSV for one case's audit trail.

Filename:

```text
audit_{case_id}_{YYYY-MM-DD}.csv
```

Columns in order:

```text
timestamp,actor_label,action,from_status,to_status,reason_code,message_sent,message_custom
```

Rules:

- Include `audit_trail` rows only.
- Exclude `demo_events`.
- Do not include PHI.

### `POST /api/cases/:id/reset`

Demo-only endpoint. Restores a case to its seeded baseline state and writes a `demo_events` row.

Locked reset strategy: Option A snapshot restore. Each seed/demo case must have a baseline snapshot available to the backend. Reset restores case fields from that snapshot, preserves existing `audit_trail` rows, and records the reset only in `demo_events`.

Backend helper contract: reset accepts the baseline snapshot as an input and prepares a case update plus a `demo_events` insert. The storage location for the snapshot is a Supabase implementation detail to confirm with Lebert.

Request:

```json
{
  "confirm": true
}
```

Response `200`:

```json
{
  "case": {
    "id": "case_001",
    "status": "new_order",
    "updated_at": "2026-07-21T15:00:00Z"
  },
  "demo_event": {
    "id": "event_001",
    "case_id": "case_001",
    "event_type": "reset",
    "created_at": "2026-07-21T15:00:00Z"
  }
}
```

Reset strategy is locked in D14 in `docs/DECISIONS.md`.

### `POST /api/cases/:id/clone`

Demo-only endpoint. Creates an independent mock case copy with status `new_order` and an empty audit trail. Writes a `demo_events` row on the source case.

Clone copies `patient_name` and `consent_flag`, resets case metadata to empty values, and does not copy audit rows.

Response `201`:

```json
{
  "case": {
    "id": "case_002",
    "status": "new_order",
    "consent_flag": true,
    "created_at": "2026-07-21T15:00:00Z",
    "updated_at": "2026-07-21T15:00:00Z"
  },
  "source_demo_event": {
    "id": "event_001",
    "case_id": "case_001",
    "event_type": "clone",
    "created_at": "2026-07-21T15:00:00Z"
  }
}
```

## Transition Gates

| Transition | Required field | Error code |
|---|---|---|
| `new_order` -> `submitted` | `doc_link` | `missing_doc_link` |
| `needs_documentation` -> `submitted` | `doc_link` | `missing_doc_link` |
| `info_request` -> `submitted` | `doc_link` | `missing_doc_link` |
| `submitted` -> `needs_documentation` | `reason_code` | `missing_reason_code` |
| `pending_review` -> `denied` | `reason_code` | `missing_reason_code` |
| `pending_review` -> `info_request` | `reason_code` | `missing_reason_code` |
| `info_request` -> `pending_review` | `reason_code` | `missing_reason_code` |
| `peer_to_peer` -> `pending_review` | `reason_code` | `missing_reason_code` |
| `approved` -> `closed` | `appointment_link` | `missing_appointment` |
| `denied` -> `closed` | `next_step_note` | `missing_next_step` |

## Open Backend Questions

Resolve or confirm these before implementation:

- Q1 hosting platform
- Q6 `actor_label` source
- Q8 `message_custom` behavior if edited text is reverted before confirmation
- Whether consent false uses a separate audit row with `action = message_suppressed`, or a transition audit row with action/message fields that expose suppression
- Final Supabase schema field names from Lebert before API code starts

## Suggested First Tests

- Every valid transition returns `200`.
- Every invalid transition returns `400 invalid_transition`.
- Every missing pre-condition field returns the exact named error code.
- `peer_to_peer` -> `approved` returns `400 invalid_transition`.
- `peer_to_peer` -> `denied` returns `400 invalid_transition`.
- `denied` -> `submitted` returns `400 invalid_transition`.
- `closed` -> any status returns `400 invalid_transition`.
- Successful transition writes exactly one audit row.
- Reset and Clone write only to `demo_events`.
- CSV export excludes `demo_events` and preserves column order.
