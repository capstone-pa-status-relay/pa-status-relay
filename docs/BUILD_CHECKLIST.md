# BUILD_CHECKLIST.md — PA Status Relay

**MVP Scope · 5-Day Demo · AI-Assisted Build**
**Version: 1.0 | July 2026**
**Owners: Jillian Krebsbach, Natalie Walker, Chris Wozniak, Lee McDonald**

---

**How to use this checklist**

Each item is written as a "done when" statement — not a task description. Check it off only when the stated condition is true, not when you've started the work. Items marked **[BLOCKER]** must be resolved before the next day's work begins. Items marked **[SYNC]** require a quick team check-in before proceeding.

Roles in this file:
- **Frontend** — Claude Code (frontend dev)
- **Backend** — Codex (backend dev)
- **QA** — QA + slides

---

## DAY 0 — Pre-Sprint (~1.5 hrs)

**Design / Frontend**
- [ ] Design tokens locked: color, type scale, spacing, border radius → `DESIGN_SYSTEM.md` created
- [ ] Case List frame is handoff-ready (columns: patient name, status chip, timestamp, consent flag)
- [ ] Case Details frame is handoff-ready (status chip, action buttons, metadata form area, audit panel placeholder)
- [ ] **[BLOCKER]** Both frames shared with backend dev before EOD — confirm data shape matches before Day 1

**Supabase**
- [ ] Supabase project created (free tier)
- [ ] All team members invited and confirmed access
- [ ] Project URL and anon key shared with all devs — not committed to public repo
- [ ] Email confirmation disabled (Settings → Auth → uncheck "Confirm email")

**Open items resolved (see DECISIONS.md)**
- [ ] Hosting platform decided (Q1)
- [ ] Frontend framework decided (Q2)
- [ ] Browser targets decided (Q5)

---

## DAY 1 — Foundation
**Goal: Auth works · Case List renders seeded data · Schema locked**

**Frontend (~2 hrs)**
- [ ] Design tokens imported into Claude Code design system
- [ ] App shell scaffolded: nav, layout, routing skeleton
- [ ] Sign-in screen built and renders correctly
- [ ] Case List UI built against hardcoded mock array — do not wait for Supabase
- [ ] **[SYNC]** Reviewed backend schema draft — no data shape mismatches flagged
- [ ] **[BLOCKER]** Figma handoff for Message Preview modal and Audit Trail panel scheduled for Day 2 EOD

**Backend (~2.25 hrs)**
- [ ] `pa_status` enum created with all 9 values — exact strings from STATE_MACHINE.md
- [ ] `cases` table created with all fields and correct types
- [ ] `audit_trail` table created with RLS: INSERT + SELECT allowed, UPDATE + DELETE denied
- [ ] `demo_events` table created
- [ ] 5 seed cases inserted covering all scenario starting states (see QA_SCENARIOS.md)
- [ ] Supabase auth flow working: sign in → session → case list redirect
- [ ] Session persists on page refresh — tested manually
- [ ] **[BLOCKER]** Schema reviewed and locked — no changes after today without full team sign-off
- [ ] Project URL + demo credentials shared with full team

**Backend — Case CRUD (~2 hrs)**
- [ ] `GET /api/cases` — returns list with correct fields
- [ ] `POST /api/cases` — creates case with required field validation
- [ ] `GET /api/cases/:id` — returns single case
- [ ] Filter by status working
- [ ] Sort by date working
- [ ] Consistent error response shape defined and shared with team (see STATE_MACHINE.md)
- [ ] **[SYNC]** Reviewed Case List frame — API response shape matches what frontend needs

**QA (~2.5 hrs)**
- [ ] 5 scripted demo scenarios written: each has named starting state, step-by-step actions, and expected output (see QA_SCENARIOS.md)
- [ ] Every P0 acceptance criterion from PRD Section 3 mapped to at least one test case
- [ ] Ambiguous ACs flagged and shared with team for resolution
- [ ] Presentation deck structure created: problem, solution, demo flow, metrics, next steps (placeholder slides)

**End of Day 1 check**
- [ ] Auth flow works end-to-end: sign in → see case list
- [ ] Case list renders seeded mock data
- [ ] Schema is locked and all devs are working from the same enum strings
- [ ] Hosting decision made and URL confirmed (even if not deployed yet)

---

## DAY 2 — Core Flows
**Goal: Coordinator can create a case · update status · see audit entry appear**

**[SYNC] Backend reset strategy is locked as Option A snapshot restore (D14). Confirm snapshot storage with the Supabase owner before wiring the Reset endpoint.**

**Frontend (~3 hrs)**
- [ ] Case List wired to live Supabase data — replace mock array
- [ ] Case Details UI built: status chip showing current state, action buttons for valid transitions
- [ ] State machine button logic: invalid transitions disabled, tooltip explains why
  - Feed STATE_MACHINE.md transition table directly into Claude Code as prompt input — do not rely on it inferring the logic
- [ ] Create Case modal built with required field validation (patient name, consent flag)
- [ ] Inline error messages match API error copy exactly — coordinate with backend
- [ ] Figma handoff complete: Message Preview modal + Audit Trail panel frames ready for Day 3

**Backend — Transition API (~2.25 hrs)**
- [ ] `POST /api/cases/:id/transition` implemented
- [ ] All valid transitions in map return 200
- [ ] All invalid transitions return 400 with correct error code
- [ ] Pre-condition gates enforced:
  - [ ] doc_link required: new_order → submitted
  - [ ] doc_link required: needs_documentation → submitted
  - [ ] doc_link required: info_request → submitted (re-submit)
  - [ ] reason_code required: pending_review → denied
  - [ ] reason_code required: pending_review → info_request
  - [ ] reason_code required: info_request → pending_review
  - [ ] reason_code required: peer_to_peer → pending_review
  - [ ] reason_code required: submitted → needs_documentation (amber return)
  - [ ] appointment_link required: approved → closed
  - [ ] next_step_note required: denied → closed
- [ ] MVP constraints enforced at API level (not just UI):
  - [ ] peer_to_peer → approved returns 400
  - [ ] peer_to_peer → denied returns 400
  - [ ] denied → submitted returns 400
  - [ ] closed → [any] returns 400
- [ ] Audit row written on every successful transition — all required fields populated
- [ ] Audit row appears within 500ms — verified manually

**Backend — Message + Consent + Demo Controls (~2.5 hrs)**
- [ ] consent_flag readable and writable on case record
- [ ] Message template engine: each of 9 statuses maps to correct patient-facing string (see STATE_MACHINE.md)
- [ ] Reset strategy locked as Option A snapshot restore — implement against the agreed snapshot storage
- [ ] `POST /api/cases/:id/reset` implemented
- [ ] demo_events row written on reset (event_type = 'reset')
- [ ] `POST /api/cases/:id/clone` implemented
- [ ] Clone creates new case with status = new_order, empty audit trail
- [ ] demo_events row written on source case (event_type = 'clone')

**QA (~2.5 hrs)**
- [ ] Dry-run of Scenario 1 (New Order → Submitted → Pending Review) against live build
- [ ] Bugs documented with repro steps
- [ ] Problem slide complete with market data
- [ ] Market Opportunity slide complete
- [ ] State machine diagram slide built

**End of Day 2 check**
- [ ] Coordinator can create a case and see it in the list
- [ ] At least one valid status transition saves and writes an audit row
- [ ] At least one invalid transition returns the correct error
- [ ] Reset and Clone return success responses (even if frontend not wired yet)

---

## DAY 3 — Audit, Preview, Consent
**Goal: Full case detail working end-to-end · status → preview → audit**

**[SYNC] Frontend + Backend — 15 minutes at start of day, before anyone builds:**
- Align on: how the transition API response triggers the preview modal
- Align on: how audit trail data is fetched and rendered
- Misalignment here costs hours to untangle

**Frontend (~2.5 hrs)**
- [ ] Message Preview modal — consent TRUE state:
  - [ ] Shows plain-language message text (locked copy from STATE_MACHINE.md)
  - [ ] Shows channel label (SMS/Portal)
  - [ ] Confirm button triggers audit write (message_sent = TRUE)
  - [ ] Coordinator can edit message text in modal
  - [ ] Edited message flagged as "custom message" in audit row
- [ ] Message Preview modal — consent FALSE state:
  - [ ] Send button disabled
  - [ ] Label: "Consent required — record consent to enable message delivery."
  - [ ] CTA button present (demo: no live flow behind it)
- [ ] Audit Trail panel:
  - [ ] Reverse chronological (most recent first) list of entries with all required fields
  - [ ] Filter by action type, actor, date range — client-side, no page reload
  - [ ] Filter summary label shows when filters are active
  - [ ] Clearing filter restores all entries
- [ ] Consent flag wired to preview modal send button state (TRUE/FALSE drives enabled/disabled)
- [ ] Accessibility pass on Days 1–2 work: tab order correct, ARIA labels present, WCAG AA contrast

**Backend — Audit Trail API (~2 hrs)**
- [ ] `GET /api/cases/:id/audit` returns all entries in correct shape
- [ ] Audit filter query params working: actor_id, action_type, date_from, date_to
- [ ] `GET /api/cases/:id/audit/export` returns CSV
- [ ] CSV filename format correct: `audit_{case_id}_{YYYY-MM-DD}.csv`
- [ ] CSV columns in correct order: timestamp, actor_label, action, from_status, to_status, reason_code, message_sent, message_custom
- [ ] RLS confirmed: direct API call attempting UPDATE on audit_trail returns 403
- [ ] `POST /api/cases/:id/clone` wired and tested end-to-end
- [ ] demo_events confirmed separate from audit_trail in CSV export

**Backend — Consent + Message Integration (~2.5 hrs)**
- [ ] consent FALSE → message suppressed → "message_suppressed" audit event logged
- [ ] message_sent = FALSE written to audit row when suppressed
- [ ] Custom message flag: if coordinator edits template, message_custom = TRUE in audit row
- [ ] **[SYNC]** Edge case decided and implemented: coordinator edits message then reverts to original — what is message_custom? (Q8 in DECISIONS.md)
- [ ] consent FALSE → TRUE mid-case: confirmed no retroactive messages sent, only next transition triggers preview
- [ ] Full integration tested: status change → preview modal → confirm → audit row appears

**QA (~3 hrs)**
- [ ] Scenarios 1, 2, and 3 run against Day 3 build
- [ ] All bugs logged with severity: demo-blocking / cosmetic / nice-to-fix
- [ ] Demo-blocking bugs shared with team before EOD
- [ ] Demo Flow slide complete (use Scenario 1 as narrative spine)
- [ ] Success Metrics slide first draft complete

**End of Day 3 check**
- [ ] Status change → message preview modal → confirm → audit entry: works end-to-end
- [ ] Consent FALSE: send button disabled, suppressed audit event logged
- [ ] Audit trail filters work without page reload
- [ ] CSV export produces correct file with correct columns
- [ ] No demo-blocking bugs outstanding (or fix plan assigned)

---

## DAY 4 — Polish + Edge Cases
**Goal: Demo-ready UI · all P0 and critical P1 complete · no demo-blocking bugs**

This is the float day. If anything from Days 2–3 slipped, it gets caught here. Be honest in the morning standup about what is truly done vs. "almost done."

**Frontend (~2.25 hrs)**
- [ ] All demo-blocking UI bugs from Day 3 QA fixed
- [ ] Status chip animation on transition: smooth, not jarring
- [ ] Success banner appears on confirmed transition
- [ ] Error state UI:
  - [ ] Missing metadata: inline error identifying exact missing field
  - [ ] Network/server failure: persistent error banner with Retry option, inputs retained
  - [ ] Unauthorized access: clear message with demo access note
- [ ] Empty state for Case List: shows example demo case prompt
- [ ] Demo control buttons clearly marked "Demo only" — badge or muted visual treatment
- [ ] Reset confirmation toast implemented
- [ ] **[BLOCKER]** Demo URL confirmed and tested — not left for Day 5 morning

**Backend — Validation + Hosting (~1.25 hrs)**
- [ ] All API bugs from Day 3 QA fixed
- [ ] Every transition in valid map tested manually against QA checklist (not just happy path)
- [ ] Every invalid transition confirmed to return correct 400 error code
- [ ] 500ms audit entry target confirmed on hosted URL (not just local)
- [ ] Reviewer credentials created and tested on fresh browser session
- [ ] **[BLOCKER]** Demo URL live and shared with full team before EOD

**Backend — Final Integration (~2 hrs)**
- [ ] All message/consent bugs from Day 3 QA fixed
- [ ] All 5 demo scenarios run independently by backend dev (separate from QA)
- [ ] CSV export tested: download file, open, confirm all columns and data correct
- [ ] demo_event rows confirmed separate from audit rows in export
- [ ] Clone → navigate to new case → run scenario: works without errors

**QA (~3 hrs)**
- [ ] Full regression: all 5 scenarios run as dress rehearsal
- [ ] Each scenario checked against QA_SCENARIOS.md line by line
- [ ] No demo-blocking bugs remaining (or escalated to team immediately)
- [ ] All slides complete except live demo screenshots
- [ ] Presenter notes written for each slide
- [ ] Reviewer feedback form ready (minimum: 2-question form)

**End of Day 4 check**
- [ ] All 5 scenarios run without errors on the hosted demo URL
- [ ] No demo-blocking bugs open
- [ ] Demo URL confirmed and shared
- [ ] Reviewer credentials confirmed and tested
- [ ] Slides complete and ready for Day 5

---

## DAY 5 — Run-Through + Reviewer Access
**Goal: One complete run-through · no blockers · reviewer access shared**

**Morning (all roles)**
- [ ] Backend: smoke test on hosted URL — auth, case list, at least one transition, audit entry
- [ ] Backend: confirm Supabase project is active (not paused)
- [ ] Frontend: quick UI pass on hosted URL — anything visually broken gets fixed before run-through
- [ ] QA: confirm reviewer credentials work on a fresh incognito browser session

**Run-through (QA facilitates · all roles present)**
- [ ] Run-through conducted as if it were the real reviewer session — no skipping steps, no narrating around bugs
- [ ] All 5 scenarios completed in order
- [ ] Any blocking issues fixed in real time (devs on standby)
- [ ] Run-through completed successfully with no blocking issues

**Post run-through**
- [ ] Reviewer access shared (credentials + demo URL)
- [ ] Reviewer feedback collected (target: ≥80% "useful/feasible")
- [ ] QA: slides finalized with screenshots from run-through
- [ ] Team: open questions and v2 next steps documented while context is fresh

**Success criteria — final sign-off**
- [ ] 5/5 demo scenarios completed without errors
- [ ] Median coordinator status update time ≤90 seconds (measured from screen recording)
- [ ] 0 patient-facing messages contain clinical jargon or denial rationale
- [ ] ≥80% of reviewers rate demo "useful/feasible"
- [ ] Audit trail export produces correct CSV for all scenarios
- [ ] No PHI present anywhere in the demo data

---

## Highest-Risk Items (read before Day 2)

**1. State machine button logic (Day 2)**
Feed STATE_MACHINE.md transition table directly into Claude Code. Do not rely on it inferring the logic. Both the API and UI must enforce the same table — verify this before EOD Day 2.

**2. Frontend/backend integration on preview modal (Day 3)**
The 15-minute sync at Day 3 start is not optional. Misalignment on the API response shape → UI trigger contract costs hours to untangle under sprint pressure.

**3. Reset snapshot storage (Day 2 Supabase sync)**
Reset strategy is locked as Option A snapshot restore. Confirm where the seed baseline snapshot lives before wiring the Reset endpoint.

**4. Hosting / demo URL (Day 4)**
Commonly left for Day 5 morning and then becomes a blocker. Confirm and test the hosted URL before EOD Day 4.

**5. Supabase free tier pausing**
Free projects pause after 1 week of inactivity. Confirm the project is active on Day 5 morning before the run-through.

---

*BUILD_CHECKLIST.md · v1.0 · July 2026*
