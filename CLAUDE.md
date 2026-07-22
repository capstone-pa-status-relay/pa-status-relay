# CLAUDE.md — PA Status Relay

Behavioral guidelines for Claude when working on this project. These rules merge general coding discipline with project-specific contracts. When in doubt, re-read this file before writing any code.

**Read these companion files before starting any session:**
- `docs/STATE_MACHINE.md` — authoritative transition table, pre-condition gates, error codes, patient message copy, display labels. Source of truth for both API and UI.
- `docs/DESIGN_SYSTEM.md` — token tables, typography, spacing, component patterns. All sections are LOCKED — safe to reference.
- `docs/DECISIONS.md` — locked decisions with rationale and rejected alternatives. Check here before making a structural choice.
- `docs/QA_SCENARIOS.md` — 5 scripted demo scenarios with step-by-step expected outputs. Know the starting states before touching any demo-path code.
- `docs/BUILD_CHECKLIST.md` — day-by-day task list with owners and verification steps.
- `docs/DOC_CONFLICTS.md` — documentation conflict audit and resolution notes.
- `docs/ui-design-SKILL-PA-Status-Relay.md` — token system, component patterns, copy rules, and engineering floor for the frontend.
- `docs/laws-of-ux-SKILL-PA-Status-Relay.md` — UX law applications per surface. Consult when designing or reviewing any component.

## Documentation Source Of Truth

The canonical project documentation lives in `docs/`.

Use `docs/` versions for all project decisions, Claude prompts, coding work, and contract checks. Duplicate root docs are pointer files only and should not be edited directly when a matching file exists in `docs/`.

---

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing anything:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Project-specific rules

**The state machine is the highest-risk contract in this build.** Every valid transition, required field, and error code is defined in `docs/STATE_MACHINE.md`. Feed that file directly into Claude Code or Codex as a prompt input when building any transition logic. Do not rely on either tool inferring the transitions from context. Both the API (Codex) and the UI (Claude Code) must enforce the same table — a discrepancy breaks the demo in a way that's hard to debug under sprint pressure.

**The audit trail is immutable by design.** No UPDATE or DELETE on `audit_trail` rows — ever. The RLS policy enforces this at the database level; the API enforces it at the endpoint level; the frontend enforces it by never rendering edit or delete controls. All three layers must agree. This is the primary trust signal for reviewers on Day 5.

**The transition API fires at modal confirmation, not at StatusDrawer button click.** "Confirm and send" in the StatusDrawer opens the modal; `POST /transition` fires when the coordinator confirms in the modal. "Log status only" bypasses the modal and fires `POST /transition` directly with `message_sent = false`. See D11 in `docs/DECISIONS.md`.

**Patient-facing message copy is locked.** The nine status-to-message mappings in `docs/STATE_MACHINE.md` are the authoritative strings. Do not paraphrase, shorten, or reword them in code. No clinical abbreviations, payer jargon, or authorization reference numbers may appear in any patient-facing string. The Denied message must not include denial reason code or clinical rationale.

**No PHI anywhere.** All demo data is mock and non-identifiable. If you are ever writing code that would capture, store, or display real patient information, stop and flag it.

**Ambiguity is a signal, not a default.** If data is missing or a state is undefined, surface it explicitly — empty state, error state, or fallback copy. Never silently default to a value or suppress an edge case.

**Demo controls are not production features.** Reset, Clone, and Re-open write to `demo_events`, not `audit_trail`. They must be visually marked "Demo only" in the UI. The QA CSV export must be clean — no demo_event rows in the audit export.

---

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Project-specific rules

**MVP scope is fixed.** Do not implement: live EHR or payer integrations, production SMS or message delivery, the appeal path (Denied → Submitted), direct Peer-to-Peer resolution (P2P → Approved or Denied), multi-org support, or any PHI handling. All explicitly deferred to v2.

**Design tokens only.** `docs/DESIGN_SYSTEM.md` is locked. Use CSS custom properties from that file for all visual decisions. Do not introduce new hex values, new component libraries, or override established tokens.

**TypeScript only.** No JavaScript-only patterns. All shared utilities must be typed.

**Filter logic is client-side.** Audit trail filtering (by action type, actor, date range) operates on the already-fetched array — no page reload, no additional API call.

**No realtime subscriptions.** On a successful transition API response, immediately refetch the audit trail for that case. Do not use Supabase realtime — adds complexity for no demo benefit at 2–4 concurrent users.

---

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that your changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### Project-specific rules

**Supabase schema is locked after Day 1.** The three core tables (`cases`, `audit_trail`, `demo_events`) are defined in the engineering spec. Do not add columns, rename fields, or alter table structure without explicit team sign-off. Schema changes after Day 1 cascade across Codex and Claude Code simultaneously — they are expensive.

**The `pa_status` enum is locked.** Exactly nine values — defined in `docs/STATE_MACHINE.md`. Use these exact strings everywhere: in the database enum, API request/response bodies, frontend state, and display logic. A mismatch between layers breaks transition validation silently.

**Error response shape is shared and must be consistent.** Every API error uses: `{ "error": "error_code", "message": "human-readable string" }`. Named error codes are defined in `docs/STATE_MACHINE.md`. Do not invent a new format or new codes.

**Use `actor_id` and `actor_label`, never `user_id`.** The Engineering Spec is authoritative on field naming. `actor_label` is hardcoded as "Demo Coordinator" for MVP (D09 in `docs/DECISIONS.md`).

---

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add transition validation" → "Return 400 with `invalid_transition` for every transition not in `docs/STATE_MACHINE.md`, and confirm with a test case"
- "Build the audit panel" → "Render all required fields, confirm filters work without reload, confirm no edit/delete controls are present"

For multi-step tasks, state a brief plan:

```
[Step] → verify: [check]
[Step] → verify: [check]
[Step] → verify: [check]
```

### Build phases

**Day 1 — Foundation:** Supabase schema + enum + RLS + seed data (5 cases) + auth flow + Case List UI (against hardcoded mock array). ✓ Complete.

**Day 2 — Core Flows:** Case List wired to Supabase + Case Details UI + state machine button logic + transition API (all valid/invalid transitions) + Reset + Clone demo controls.

**Day 3 — Audit, Preview, Consent:** Message preview modal (consent TRUE and FALSE states) + audit trail panel + filter logic + CSV export + consent gating + suppressed-message audit event.

**Day 4 — Polish + Edge Cases:** Float day. Error states, empty states, status chip animation, demo control visual treatment, hosted URL confirmed and tested.

**Day 5 — Run-Through + Reviewer Access:** Smoke test, full 5-scenario run-through, reviewer credentials shared, feedback collected.

---

## 5. State Machine Contract — NEVER BREAK THIS

`docs/STATE_MACHINE.md` is the single source of truth. Both Codex (API) and Claude Code (UI) enforce the same transition table. Any change requires sign-off from the backend dev and frontend dev with a minimum 2-hour review window before code is written.

### Enforcement rules

- Feed `docs/STATE_MACHINE.md` directly into prompts when building transition logic — do not rely on inference.
- Invalid transitions render as **disabled buttons** (not hidden). Tooltip explains why.
- UI disabling is a UX guard. The API 400 is the real guard. Both must be present.
- Any transition not in the valid map returns HTTP 400. No exceptions.

### What each role owns

| Surface | Owner | Tool |
|---|---|---|
| Transition API + RLS + schema | Chris (Backend Dev) | Codex |
| State machine UI + button logic | Jill (Frontend Dev) | Claude Code |
| Audit trail display + filter logic | Jill (Frontend Dev) | Claude Code |
| Message preview modal + consent logic | Jill + Chris | Claude Code + Codex |
| Demo controls (Reset, Clone, Re-open) | Chris (Backend Dev) | Codex |

---

## 6. Audit Trail — Non-Negotiable

The audit trail is the primary evidence of workflow integrity for reviewers. Treat it like a compliance surface.

- Every successful status transition writes one row to `audit_trail` within 500ms.
- No UPDATE or DELETE — enforced by RLS, API (returns 403), and frontend (no controls rendered).
- Demo controls write to `demo_events` only. CSV export pulls from `audit_trail` only.
- Audit trail renders **reverse chronological (most recent first)** everywhere.
- Consent gating rules:
  - `consent = TRUE` → preview modal opens, send enabled, `message_sent = TRUE` on confirm
  - `consent = FALSE` → preview modal opens, send disabled, banner: "Consent required — record consent to enable message delivery.", `message_suppressed` audit event logged, `message_sent = FALSE`
  - `consent FALSE → TRUE` mid-case → no retroactive sends, next transition only

---

## 7. Key Contracts

All detailed contract content lives in `docs/STATE_MACHINE.md`. This section states the rules for how to treat them.

**Transition table** — do not reproduce or paraphrase it in code comments or inline logic. Reference `docs/STATE_MACHINE.md` directly.

**Error codes** — use the named codes from `docs/STATE_MACHINE.md` exactly. Do not add new ones without updating that file and getting team sign-off.

**Patient message copy** — use the locked strings from `docs/STATE_MACHINE.md` verbatim. Do not paraphrase in template logic.

**Audit CSV** — filename `audit_{case_id}_{YYYY-MM-DD}.csv`, columns in order: `timestamp`, `actor_label`, `action`, `from_status`, `to_status`, `reason_code`, `message_sent`, `message_custom`. No demo_event rows.

**Auth** — email/password via Supabase, email confirmation disabled, session persists on refresh, no SSO/OAuth/magic link.

**Reset strategy** — decide Option A (snapshot) vs. Option B (re-seed) at Day 2 morning standup before touching the endpoint. Log decision in `docs/DECISIONS.md` (Q3).

---

## 8. Tech Stack

| Layer | Choice |
|---|---|
| Backend / DB | Supabase (Postgres + Auth + RLS) |
| Backend tooling | Codex (Chris only) |
| Frontend tooling | Claude Code (Jill) |
| Frontend framework | React 18 + Vite + TypeScript |
| Styling | CSS custom properties via `docs/DESIGN_SYSTEM.md` (LOCKED) |
| Hosting | Vercel |
| Auth | Supabase email/password |
| Data | Mock only — no EHR, no payer integrations |
| Browser targets | Chrome only |
| Concurrency | ~2–4 users (internal demo only) |

---

## 9. Open Items

Three items remain open on their scheduled days. All others are resolved — see `docs/DECISIONS.md`.

| # | Item | Owner | Due |
|---|---|---|---|
| Q3 | Reset strategy: snapshot vs. re-seed | Chris (Backend Dev) | Day 2 morning standup |
| Q4 | Demo credentials: how many sets, who gets access Day 5 | Natalie (QA) | Day 4 EOD |
| Q8 | message_custom on revert: if coordinator edits then reverts, is flag TRUE or FALSE | Jill + Chris | Day 3 morning sync |

---

## 10. Demo Scenario Reference

Five scenarios, Day 5. Know the starting states before touching any demo-path code. Full step-by-step scripts in `docs/QA_SCENARIOS.md`.

| # | Starting state | Consent | Scenario |
|---|---|---|---|
| 1 | new_order | TRUE | Full happy path: New Order → Submitted → Pending Review → Approved → Closed |
| 2 | needs_documentation | TRUE | Docs missing at intake: blocked transition, metadata enforcement |
| 3 | pending_review | FALSE | Consent gating: preview shown, send disabled, suppression logged |
| 4 | info_request | TRUE | Payer info request branch: both Info Request exits tested |
| 5 | peer_to_peer | TRUE | P2P constraint: Peer-to-Peer → Pending Review only |

Seed data must match these starting states exactly. Review against `docs/QA_SCENARIOS.md` before Day 2 standup.

---

## 11. Supabase Operational Notes

- Free tier: one owner creates the project, invites others via Organization Members.
- Free projects pause after 1 week of inactivity — confirm active on Day 5 morning before run-through.
- Project URL and anon key shared with all team members before Day 1 standup. Do not commit to a public repo.
- **RLS false-empty-table pattern:** if a Supabase query via unauthenticated context (anon key in a script, curl, or test run outside the app) returns zero rows, do not conclude the table is empty. RLS restricts SELECT to authenticated users — an anon caller sees zero rows regardless of real data. Verify via the Supabase SQL editor (bypasses RLS) before reporting a table as empty or proposing to re-seed.

---

## 12. Reference Files

| File | Purpose |
|---|---|
| `docs/STATE_MACHINE.md` | Transition table, pre-conditions, error codes, patient message copy, display labels |
| `docs/DESIGN_SYSTEM.md` | Tokens, typography, spacing, components — LOCKED, safe to reference |
| `docs/DECISIONS.md` | Locked decisions + open items log |
| `docs/BUILD_CHECKLIST.md` | Day-by-day task list with owners and verification steps |
| `docs/QA_SCENARIOS.md` | 5 scripted demo scenarios with step-by-step expected outputs |
| `docs/DOC_CONFLICTS.md` | All 8 pre-implementation conflicts — all resolved |
| `docs/ui-design-SKILL-PA-Status-Relay.md` | Frontend design system and engineering rules |
| `docs/laws-of-ux-SKILL-PA-Status-Relay.md` | UX law applications by surface |
