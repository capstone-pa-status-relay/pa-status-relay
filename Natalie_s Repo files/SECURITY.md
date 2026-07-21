# Security Posture — PA Status Relay (MVP Demo)

This is a demo on mock data, not a production healthcare system. Never describe or present it as HIPAA-compliant or PHI-safe.

## What this MVP is scoped to handle

- **Mock data only.** All 5 seed cases are fictional. No real patient information is entered, stored, or displayed.
- **No PHI.** PRD Non-Goal, explicit.
- **No live payer or EHR integration.** No external API keys or credentials to real systems.
- **No production message delivery.** Patient message previews render in a modal only. No SMS/email provider integrated.

## Access control (from Engineering Spec)

- **Authentication:** Supabase email/password. Email confirmation disabled for demo. One shared demo credential set for the internal reviewer session. No SSO/OAuth/magic link.
- **Roles:** Owner (project creator), Admin (Backend Dev 2), Developer (Frontend/You). Assigned via Supabase Organization Members.
- **Row Level Security, exact policy on `audit_trail`:**
  - INSERT: allowed for authenticated users
  - SELECT: allowed for authenticated users
  - UPDATE: denied for all
  - DELETE: denied for all
- **Audit immutability is enforced at three layers, and all three must agree:**
  1. Database: RLS denies UPDATE/DELETE outright
  2. API: no PUT/PATCH/DELETE endpoint exists for audit rows; any attempt returns `403 audit_immutable`
  3. Frontend: no edit/delete controls rendered anywhere on audit rows
- **RLS false-empty-table trap:** an anonymous/unauthenticated query against a table (script, curl, test run outside the app) returns zero rows regardless of real data, because RLS restricts SELECT to authenticated users. Don't mistake that for an empty table, verify via the Supabase SQL editor (bypasses RLS) before concluding a table is empty or re-seeding.

## Error handling (consistent shape, per Engineering Spec 3b)

Every API error returns:
```json
{ "error": "error_code", "message": "human-readable string" }
```
Named codes: `invalid_transition`, `missing_doc_link`, `missing_reason_code`, `missing_appointment`, `missing_next_step`, `audit_immutable`, `unauthorized`. Do not invent new codes without updating the shared spec.

## Environment variables

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are shared with the team before Day 1 standup. **Do not commit these to a public repo.**

## Known gaps, explicitly deferred to v2 (not covered by the source document, added here as standard practice)

- No encryption-at-rest policy beyond Supabase defaults
- No access/login audit trail separate from the case status audit trail
- No rate limiting or abuse protection (acceptable at 2–4 concurrent demo users, not at scale)
- No incident response plan
- No third-party security review or penetration test

## Before this touches any real patient data

A signed BAA with Supabase (or HIPAA-eligible hosting migration), a formal PHI data flow review, encryption-at-rest verification, an incident response plan, and a third-party security review all become required, not optional, the moment this moves beyond an internal demo with mock data.
