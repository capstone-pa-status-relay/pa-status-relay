# PA Status Relay

Practice-side prior authorization status tracking for oncology infusion coordinators. A single dashboard to log, track, and relay PA status updates for infused, buy-and-bill drugs, with an immutable audit trail and plain-language patient message previews.

**Owners:** Jillian Krebsbach, Natalie Walker, Chris Wozniak, Lee McDonald
**Status:** MVP demo build (mock data, no live integrations), 5-day AI-assisted sprint
**Full spec:** PRD (condensed) + Engineering Spec + Build Checklist, single combined document, v1.0, July 2026

## What this is (and isn't)

A 5-day demo build validating the coordinator workflow, the 9-status state machine, and the patient message preview experience using seeded mock data in Supabase.

It is **not**: connected to any live EHR or payer system, sending real SMS/email, handling PHI, or implementing the appeal/denial loop (Denied → Submitted) or direct Peer-to-Peer resolution. All deferred to v2.

## Tech stack

| Layer | Choice |
|---|---|
| Backend / DB | Supabase (Postgres + Auth + Row Level Security) |
| Frontend | Figma design tokens → Claude Code |
| Backend logic | Codex (state machine, transition API, demo controls) |
| Hosting | TBD at Day 1 kickoff (Vercel / Netlify / Supabase hosting — confirm before EOD Day 1) |
| Auth | Supabase email/password, email confirmation disabled for demo |
| Concurrency | ~2–4 users (internal demo only) |

## Team roles (from Build Checklist)

The four owners map to four functional roles for the sprint, not generic "collaborators":

| Role | Owns |
|---|---|
| **You** (Design / Frontend) | Figma tokens, app shell, Case List/Details UI, state machine button logic, message preview modal UI, audit trail panel UI, accessibility pass |
| **Backend Dev 1** | Schema, auth, transition API, pre-condition gates, audit trail API, RLS enforcement, hosting |
| **Backend Dev 2** | Case CRUD, message template engine, consent/demo controls logic (Reset, Clone, Re-open) |
| **QA / Slides** | 5 scripted demo scenarios, acceptance-criteria mapping, bug logging by severity, presentation deck |

*Which of the four people (Jillian, Natalie, Chris, Lee) holds which role is not specified in the source document — confirm with the team before Day 0.*

## Core concepts

- **Case** — a mock PA request moving through the 9-status state machine (`new_order` → ... → `closed`).
- **Audit trail** — append-only log, one row per successful transition: `{ id, case_id, from_status, to_status, actor_id, actor_label, timestamp, reason_code, doc_link, message_sent, message_text, message_custom }`. No UPDATE or DELETE, enforced at the RLS level, the API level (403), and the frontend (no controls rendered).
- **Demo events** — Reset, Clone, and Re-open write to a separate `demo_events` table (`event_type`: reset | clone | reopen), never to the audit trail.
- **Consent flag** — gates whether a patient-facing message actually sends; suppression is itself an audited event.

## Local setup

```bash
git clone <repo-url>
cd pa-status-relay
npm install
cp .env.example .env.local   # SUPABASE_URL, SUPABASE_ANON_KEY
npm run dev
```

Requires the Supabase project schema from Engineering Spec Section 2 applied, with 5 seed cases matching Section 2e exactly (each seed case's starting state corresponds to one of the 5 QA scenarios).

## Day-by-day build sequence

| Day | Goal |
|---|---|
| 0 | Figma tokens + Case List/Details frames locked; Supabase project created, all 4 invited |
| 1 | Auth works, Case List renders seeded data, schema locked |
| 2 | Coordinator can create a case, update status, see an audit entry appear |
| 3 | Full case detail working end-to-end: status → preview → audit |
| 4 | Demo-ready UI, all P0 and critical P1 complete, no demo-blocking bugs |
| 5 | One complete run-through, no blockers, reviewer access shared |

## Success criteria (final sign-off)

- 5/5 demo scenarios completed without errors
- Median coordinator status update time ≤90 seconds
- 0 patient-facing messages contain clinical jargon or denial rationale
- ≥80% of reviewers rate the demo "useful/feasible"
- Audit trail export produces correct CSV for all scenarios
- No PHI present anywhere in the demo data

## Repo structure

```
/src                     React app
/supabase                schema, RLS policies, seed data
CLAUDE.md                agent behavioral guidelines (authoritative)
STATE_MACHINE.md         transition table, error codes, message copy (referenced, not yet built)
DESIGN_SYSTEM.md         tokens (referenced, not yet built — do not use until LOCKED)
DECISIONS.md             locked decisions log (referenced, not yet built)
QA_SCENARIOS.md          5 scripted demo scenarios (authoritative)
BUILD_CHECKLIST.md       day-by-day checklist (source: full PRD document)
RULES.md                 branch/PR/collaboration rules
SECURITY.md              security posture
REGRESSION_TESTS.md      PRD-derived test cases
HISTORY.md               project narrative and pivot record
chronicle.sh             build/session audit log generator
```
