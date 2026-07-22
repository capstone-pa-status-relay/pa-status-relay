# DECISIONS.md — PA Status Relay

Running log of locked decisions with rationale and rejected alternatives. Update this file when an open item from CLAUDE.md is resolved. Do not close items silently.

**Format:** Each entry has a date, decision, rationale, and what was rejected. Keep entries short — the point is to have a record, not to write an essay.

---

## Locked Decisions

### D01 — Audit trail is immutable, no appeal path in MVP
**Date:** July 2026 (PRD v0.4)
**Decision:** No UPDATE or DELETE on `audit_trail` rows in MVP. No appeal path (Denied → Submitted). Both deferred to v2.
**Rationale:** Immutability is a trust signal for reviewers and a compliance prerequisite for any production build. Appeal logic requires payer-specific branching that is out of scope for a 5-day demo.
**Rejected:** Soft-delete pattern with hidden rows — rejected because it undermines the audit integrity story.

### D02 — Demo controls write to `demo_events`, not `audit_trail`
**Date:** July 2026 (PRD v0.4)
**Decision:** Reset, Clone, and Re-open write to a separate `demo_events` table. CSV export pulls from `audit_trail` only.
**Rationale:** Keeps QA exports clean. Reviewers evaluating audit integrity should not see demo artifacts in the export.
**Rejected:** Writing demo events to audit_trail with a special flag — rejected because it pollutes the export and complicates the immutability story.

### D03 — No Supabase realtime for 500ms audit target
**Date:** July 2026 (Engineering Spec v1.0)
**Decision:** On a successful transition API response, immediately refetch the audit trail for that case. Do not use Supabase realtime subscriptions.
**Rationale:** Simpler. Realtime adds complexity and a new failure mode for no demo benefit at 2–4 concurrent users.
**Rejected:** Realtime subscription — adds setup overhead and subscription management for a marginal latency gain.

### D04 — No PHI anywhere in MVP
**Date:** July 2026 (PRD v0.4)
**Decision:** All demo data is mock and non-identifiable. No real patient names, no real authorization numbers, no real payer data.
**Rationale:** No PHI handling or HIPAA compliance certification in MVP scope. Demo data must be safe to share in any review context.
**Rejected:** Using anonymized real data — rejected because the anonymization process itself creates compliance exposure.

### D05 — Single-role auth (email/password, no magic link)
**Date:** July 2026 (Engineering Spec v1.0)
**Decision:** Supabase email/password auth. Email confirmation disabled. One shared demo credential set for reviewer session.
**Rationale:** Simplest auth path for a 5-day demo. Magic link adds inbox dependency during the Day 5 reviewer session.
**Rejected:** Magic link — requires inbox access during demo; SSO — out of scope for MVP.

### D06 — Frontend framework: React 18 + Vite + TypeScript
**Date:** July 2026 (Day 1 kickoff)
**Decision:** React 18 + Vite + TypeScript. Single-page app, no SSR, no routing library beyond local useState screen toggling.
**Rationale:** Simplest scaffold for a client-side SPA with no SEO or server-rendering requirements. Faster dev server than Next.js, flat mental model, maximum portability if backend dev touches frontend glue code.
**Rejected:** Next.js — adds SSR complexity with no demo benefit; plain Vite without React — insufficient component model for this UI complexity.

### D07 — Hosting: Vercel
**Date:** July 2026 (Day 1 kickoff)
**Decision:** Vercel for hosting.
**Rationale:** Zero-config deployment for Vite + React, instant preview URLs, free tier sufficient for 2–4 concurrent demo users.
**Rejected:** Netlify — viable but team has more Vercel familiarity; Supabase hosting — limited to static files only, no edge functions needed but less familiar deployment flow.

### D08 — Browser targets: Chrome only
**Date:** July 2026 (Day 1 kickoff)
**Decision:** Chrome only for the Day 5 demo.
**Rationale:** Eliminates cross-browser polish work from Day 4 float time. All reviewers will be briefed to use Chrome. No production users in MVP scope.
**Rejected:** Chrome + Safari — adds Day 4 polish risk; Chrome + Firefox — same concern.

### D09 — actor_label: hardcoded "Demo Coordinator"
**Date:** July 2026 (Day 1 kickoff)
**Decision:** Hardcode `actor_label = "Demo Coordinator"` for all audit rows in MVP.
**Rationale:** Single-role demo with one shared credential set. Pulling from auth.users metadata adds setup complexity for no reviewer-visible benefit.
**Rejected:** Pull from auth.users metadata — only matters if multiple named reviewers interact on Day 5, which is not the plan.

### D10 — Design system tokens locked
**Date:** July 2026 (Day 0)
**Decision:** DESIGN_SYSTEM.md is complete and locked. All token, typography, spacing, radius, and component patterns defined. Safe to reference in Claude Code sessions.
**Rationale:** Day 0 blocker resolved before any frontend CSS was written. Token system uses CSS custom properties (`--pa-*` namespace) not Tailwind utility classes. IBM Plex Sans (base) + IBM Plex Mono (timestamps, codes) as the font stack. Deep Navy + Sapphire direction for color palette.
**Rejected:** Tailwind CSS utility classes — the DESIGN_SYSTEM.md Tailwind reference was a Gemini artifact; overridden by the locked CSS custom property system. Placeholder file with TBDs — explicitly avoided per CLAUDE.md constraint.

### D11 — Transition API commit point: modal is the commit point
**Date:** July 2026 (Day 1, C1 resolution)
**Decision:** Version B confirmed. `POST /transition` fires at modal confirmation, not at StatusDrawer footer button click.
- "Confirm and send" in StatusDrawer → opens modal → coordinator confirms → `POST /transition` fires with all fields including `message_text` and `message_custom`.
- "Log status only" in StatusDrawer → fires `POST /transition` directly with `message_sent = false`, bypassing the modal entirely.
- The StatusDrawer inline message preview is read-only. The modal is the editable confirm step and the API commit point.
**Rationale:** Engineering Spec single request body includes `message_text` and `message_custom` — fields only known after modal interaction. Consistent with QA_SCENARIOS.md step-by-step expected outputs.
**Rejected:** Version A (StatusDrawer is the commit point, modal is post-commit) — creates split between when the transition commits and when the message is confirmed, complicating rollback and audit integrity.

### D12 — Audit trail sort order: reverse chronological
**Date:** July 2026 (Day 1, C2 resolution)
**Decision:** Audit trail renders reverse chronological (most recent first) everywhere — drawer display, CSV export row order, and API default response order.
**Rationale:** DESIGN_SYSTEM.md and Engineering Spec are both explicit: "reverse chronological (most recent first)." This is the UX convention for audit logs and activity feeds. PRD and original QA wording used "chronological" as shorthand for "time-ordered" without specifying direction.
**Rejected:** Oldest-first (strict chronological) — conflicts with both implementation-authoritative documents and standard audit log convention.

### D13 — Consent suppression banner: canonical string locked
**Date:** July 2026 (Day 1, C7 resolution)
**Decision:** Single canonical string for the consent=FALSE banner: **"Consent required — record consent to enable message delivery."**
This string is used in both the StatusDrawer (when consent=FALSE) and the Message Preview Modal (when consent=FALSE). All other variants retired.
**Rationale:** QA_SCENARIOS.md Scenario 3 Step 2 defines the pass/fail expected output. Chosen string is forward-looking (states what to do) rather than a statement of past suppression, and avoids the suppressed framing that implies the action already occurred. Consistent with QA expected output.
**Rejected:** "Message suppressed — patient has not consented to status updates." (DESIGN_SYSTEM.md §8b) — past-tense framing, not actionable; "Message suppressed — record patient consent to enable delivery." (DESIGN_SYSTEM.md §8d) — inconsistent with QA expected output.

### D14 — Reset strategy: snapshot restore
**Date:** July 2026 (Day 2, Q3 resolution)
**Decision:** Use Option A for Reset: store or maintain a baseline snapshot for each seed/demo case and restore the case from that snapshot when `POST /api/cases/:id/reset` runs. Reset writes a `demo_events` row with `event_type = 'reset'` and does not delete or rewrite existing `audit_trail` rows.
**Rationale:** Snapshot restore is more reliable than re-running seed inserts because demo cases may be edited during testing. It gives Reset one clear target state per case while preserving audit immutability.
**Rejected:** Option B, re-running seed inserts for the case_id — rejected because it is more fragile after edits, can create idempotency problems, and risks accidentally changing audit evidence instead of only restoring the case baseline.

---

## Open Items (resolve and move to Locked Decisions above)

### Q4 — Demo credentials
**Status:** Open — resolve before Day 4 EOD
**Question:** How many credential sets? Who gets access on Day 5?
**Owner:** QA (Natalie)
**Constraint:** Reviewer credentials must be tested in a fresh incognito browser session before Day 5.
**Resolution:** *(fill in)*

---

### Q8 — message_custom flag on revert
**Status:** Open — resolve at Day 3 morning sync
**Question:** If a coordinator edits the message text in the preview modal and then reverts to the original template text before confirming, is message_custom = TRUE or FALSE in the audit row?
**Owner:** Backend dev (Chris) + Frontend dev (Jill)
**Note:** Decide this at the Day 3 integration sync before either side builds the modal confirm logic.
**Resolution:** *(fill in)*

---

*DECISIONS.md · v2.0 · July 2026 · Update when open items resolve — do not close silently*
