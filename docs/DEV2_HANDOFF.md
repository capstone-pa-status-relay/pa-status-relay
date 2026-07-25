# Dev2 Handoff

## Current Status

Dev2 backend contract work is in place on `main` for the Vercel `/api` route layer, pure backend services, Supabase repository boundary, transition validation, consent/message behavior, demo controls, audit trail retrieval, and CSV export.

Recent verification:

- Local build passes: `npm run build`
- Local lint passes: `npm run lint`
- Backend tests pass: `node --test tests/*.test.ts`
- Hosted read-only smoke checks pass for `/api/cases`, `/api/cases/:id/audit`, `/api/cases/:id/audit/export`, and write-route registration via `405 Method Not Allowed` on `GET`

## Dev2 Completed

- Case CRUD service helpers and API handlers
- Transition service, state machine enforcement, and locked message templates
- Consent suppression behavior and `message_suppressed` audit action
- Reset, Clone, and Re-open demo-control helpers and API handlers
- Audit trail service, reverse-chronological response behavior, filters, and CSV export
- Vercel API route scaffold and route-registration fixes
- Supabase repository review/support work with Lebert's implementation merged
- Route fallback tests for missing server-side Supabase env vars
- Read-only hosted smoke script: `npm run smoke:hosted:readonly`

## Still Needs Live QA Confirmation

- Full hosted status transition flow: modal confirm -> `POST /transition` -> case status update -> audit row appears
- 500ms audit-entry target on the hosted Vercel URL
- Consent false scenario: no message sent, `message_suppressed`, `reason_code = no_consent`
- Reset preserves audit history and writes only to `demo_events`
- Clone creates an independent `new_order` case with empty audit trail
- CSV export remains free of `demo_events`

## Coordinate Before Changing

- Actor identity/auth spoofing fix: coordinate with Lebert because it touches Supabase auth/session assumptions and service-role routing.
- Frontend audit refresh after transition: coordinate with Jill because it touches `App.tsx` UI behavior.
- Any data-changing hosted smoke tests: coordinate with Natalie so QA knows which seed/demo records were changed.
