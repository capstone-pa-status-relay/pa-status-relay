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

---

## Open Items (resolve and move to Locked Decisions above)

### Q1 — Hosting platform
**Status:** Open — resolve at Day 1 kickoff
**Question:** Vercel, Netlify, or Supabase hosting?
**Owner:** Backend dev
**Constraint:** Demo URL must be confirmed and tested before EOD Day 4.
**Resolution:** *(fill in)*

---

### Q2 — Frontend framework
**Status:** Open — resolve at Day 1 kickoff
**Question:** React + Vite, Next.js, or other?
**Owner:** Frontend dev
**Constraint:** Must be decided before app shell is scaffolded on Day 1.
**Resolution:** *(fill in)*

---

### Q3 — Reset strategy
**Status:** Open — resolve at Day 2 morning standup
**Question:** Option A (store snapshot of seed state at creation, restore from snapshot on Reset) or Option B (re-run seed insert for that case_id)?
**Owner:** Backend dev
**Recommended:** Option A — more reliable for cases that have been edited after seeding.
**Resolution:** *(fill in)*

---

### Q4 — Demo credentials
**Status:** Open — resolve before Day 4 EOD
**Question:** How many credential sets? Who gets access on Day 5?
**Owner:** QA
**Constraint:** Reviewer credentials must be tested in a fresh incognito browser session before Day 5.
**Resolution:** *(fill in)*

---

### Q5 — Browser targets
**Status:** Open — resolve at Day 1 kickoff
**Question:** Chrome only for demo, or also Safari and/or Firefox?
**Owner:** Frontend dev
**Note:** The simpler the browser target, the less Day 4 polish time is consumed by cross-browser fixes.
**Resolution:** *(fill in)*

---

### Q6 — actor_label source
**Status:** Open — resolve at Day 1 kickoff
**Question:** Pull actor_label from auth.users metadata, or hardcode "Demo Coordinator" for MVP?
**Owner:** Backend dev
**Note:** Hardcoding is simpler and sufficient for a single-role demo. Pull from metadata if multiple named reviewers will interact on Day 5.
**Resolution:** *(fill in)*

---

### Q7 — Design system
**Status:** Open — resolve before Day 1 (Day 0 blocker)
**Question:** Tokens, component library, typography scale — what is locked?
**Owner:** Frontend dev
**Constraint:** Do not create DESIGN_SYSTEM.md until tokens are actually decided. A placeholder file with TBDs causes Claude Code to produce inconsistent output. Lock tokens on Day 0, create the file, then start frontend work.
**Resolution:** *(fill in)*

---

### Q8 — message_custom flag on revert
**Status:** Open — resolve at Day 3 morning sync
**Question:** If a coordinator edits the message text in the preview modal and then reverts to the original template text before confirming, is message_custom = TRUE or FALSE in the audit row?
**Owner:** Backend dev + Frontend dev
**Note:** Decide this at the Day 3 integration sync before either side builds the modal confirm logic.
**Resolution:** *(fill in)*

---

*DECISIONS.md · v1.0 · July 2026 · Update when open items resolve — do not close silently*
