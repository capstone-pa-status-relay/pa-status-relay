# DOC_CONFLICTS.md — PA Status Relay

Documentation conflicts identified pre-implementation and their resolutions.
All 8 conflicts are resolved. This file is a permanent record — do not remove entries.

Audited: CLAUDE.md · STATE_MACHINE.md · DESIGN_SYSTEM.md · DECISIONS.md · QA_SCENARIOS.md · PRD (both versions, identical content) · Engineering Spec (embedded in PRD file) · Build Checklist (embedded in PRD file)

---

## Summary Table

| # | Conflict | Documents | Severity | Status |
|---|---|---|---|---|
| C1 | Transition API fires before or after modal confirm | DESIGN_SYSTEM.md §8b vs. §8d vs. QA_SCENARIOS | Demo-blocking | ✅ RESOLVED — D11 |
| C2 | Audit trail sort order: chronological vs. reverse-chrono | PRD + QA vs. DESIGN_SYSTEM + Eng Spec | Demo-blocking | ✅ RESOLVED — D12 |
| C3 | DESIGN_SYSTEM.md lock status inconsistent across files | DESIGN_SYSTEM.md vs. DECISIONS.md Q7 | High | ✅ RESOLVED — D10 |
| C4 | Framework and styling approach undecided per CLAUDE.md | DESIGN_SYSTEM.md vs. CLAUDE.md vs. DECISIONS.md Q2 | High | ✅ RESOLVED — D06, D10 |
| C5 | Invalid transition buttons: "absent or disabled" | QA_SCENARIOS Scenario 5 Step 1 vs. all others | Medium | ✅ RESOLVED — QA updated |
| C6 | Modal fires when consent=FALSE | PRD vs. Engineering Spec + QA | Demo-blocking | ✅ RESOLVED — D11 |
| C7 | Consent suppression banner copy: 3 different strings | DESIGN_SYSTEM.md §8b vs. §8d vs. QA | High | ✅ RESOLVED — D13 |
| C8 | Audit schema field: `user_id` vs. `actor_id` | PRD vs. Engineering Spec | Low | ✅ RESOLVED — Eng Spec authoritative |

---

## C1 — When does the transition API call fire: before or after modal confirmation?

**Status: ✅ RESOLVED**
**Resolution (D11):** Version B confirmed. Modal is the API commit point.
- "Confirm and send" in StatusDrawer → opens modal → coordinator confirms → `POST /transition` fires with all fields.
- "Log status only" in StatusDrawer → fires `POST /transition` directly with `message_sent = false`, bypassing the modal.
- StatusDrawer inline message preview is read-only. Modal is the editable confirm step and the API commit point.

**Original conflict:** DESIGN_SYSTEM.md §8b described terminal footer buttons in the StatusDrawer implying the transition commits there. DESIGN_SYSTEM.md §8d described a separate modal triggered "after" the drawer. QA_SCENARIOS.md placed the status update after the modal confirm, not after the drawer. Engineering Spec's single request body includes `message_text` and `message_custom` — fields only known after modal interaction — implying a single API call after the modal.

---

## C2 — Audit trail sort order: chronological vs. reverse chronological

**Status: ✅ RESOLVED**
**Resolution (D12):** Reverse chronological (most recent first) everywhere — drawer display, API default response order, CSV row order.

QA_SCENARIOS.md Scenario 1 Step 7 updated from "Chronological order" to "Reverse chronological order (most recent first)."

**Original conflict:** PRD Section 3 and QA_SCENARIOS.md Scenario 1 Step 7 said "chronological." DESIGN_SYSTEM.md §8c and Engineering Spec §7 both explicitly said "reverse chronological (most recent first)." DESIGN_SYSTEM.md and Engineering Spec are the implementation-authoritative documents.

---

## C3 — DESIGN_SYSTEM.md is marked LOCKED but DECISIONS.md Q7 shows it as Open

**Status: ✅ RESOLVED**
**Resolution (D10):** DECISIONS.md Q7 closed. DESIGN_SYSTEM.md is locked. All token, typography, spacing, radius, and component patterns are defined and safe to reference in Claude Code sessions.

**Original conflict:** DESIGN_SYSTEM.md header said "STATUS: LOCKED." DECISIONS.md Q7 said "Status: Open." CLAUDE.md listed Q7 as unresolved. A developer reading DECISIONS.md first would treat the design system as provisional.

---

## C4 — Frontend framework and styling approach undecided per CLAUDE.md

**Status: ✅ RESOLVED**
**Resolution (D06, D10):** React 18 + Vite + TypeScript confirmed as framework. CSS custom properties (not Tailwind) confirmed as styling approach. CLAUDE.md §8 tech stack table updated. DECISIONS.md Q2 closed.

Note on the Tailwind reference in DESIGN_SYSTEM.md: the original DESIGN_SYSTEM.md Tailwind reference was a Gemini artifact from an early draft. The locked design system uses CSS custom properties with `--pa-*` namespace throughout. Tailwind is not used in this project.

**Original conflict:** DESIGN_SYSTEM.md §1 listed "Next.js / React" and "Tailwind CSS." CLAUDE.md §8 showed framework as "[TO FILL IN]" and styling as "CSS custom properties." DECISIONS.md Q2 showed framework as open. DESIGN_SYSTEM.md's own component examples used inline `style={{}}` with hex values rather than Tailwind classes — an internal inconsistency.

---

## C5 — Invalid transition button behavior: "absent or disabled" vs. "disabled (not hidden)"

**Status: ✅ RESOLVED**
**Resolution:** QA_SCENARIOS.md Scenario 5 Step 1 updated from "absent or disabled" to "disabled (not hidden)." Matches STATE_MACHINE.md, CLAUDE.md §5, Engineering Spec §7, and DESIGN_SYSTEM.md §9 — all four documents are unanimous.

**Original conflict:** QA_SCENARIOS.md Scenario 5 Step 1 said "absent or disabled." Every other document said "disabled (not hidden)" explicitly. Step 2 of the same scenario had already corrected itself ("Buttons disabled (not hidden)") making Step 1 internally inconsistent within QA_SCENARIOS.md.

---

## C6 — Message preview modal trigger when consent = FALSE

**Status: ✅ RESOLVED**
**Resolution (D11):** Modal fires on every status transition regardless of consent flag. When consent=FALSE, the modal opens with the send button disabled and the canonical banner displayed. The suppression audit event fires when the coordinator dismisses the modal or clicks "Skip message."

**Original conflict:** PRD Section 3 implied the modal only fires when consent=TRUE ("User sees a plain-language message preview modal on every status change when consent flag is TRUE"). Engineering Spec §4b and QA_SCENARIOS.md Scenario 3 both showed the modal opening when consent=FALSE with the send button disabled inside it. Engineering Spec and QA are the implementation authorities.

---

## C7 — Consent suppression warning banner copy: three different strings

**Status: ✅ RESOLVED**
**Resolution (D13):** Canonical string locked: **"Consent required — record consent to enable message delivery."**

Used in both the StatusDrawer and the Message Preview Modal when consent=FALSE. All other variants retired. DESIGN_SYSTEM.md §8b and §8d updated to match. QA_SCENARIOS.md Scenario 3 Step 2 expected output matches this string.

**Original conflict:** Three different strings across three locations:
- DESIGN_SYSTEM.md §8b: "Message suppressed — patient has not consented to status updates."
- DESIGN_SYSTEM.md §8d: "Message suppressed — record patient consent to enable delivery."
- QA_SCENARIOS.md Scenario 3 Step 2: "Consent required — record consent to enable message delivery."

---

## C8 — Audit schema field: `user_id` vs. `actor_id`

**Status: ✅ RESOLVED**
**Resolution:** Engineering Spec §2c is authoritative. Use `actor_id` and `actor_label` everywhere. `user_id` does not appear as a column name in any table. `actor_label` is hardcoded "Demo Coordinator" for MVP (D09).

**Original conflict:** PRD Appendix audit schema summary used `user_id`. Engineering Spec §2c table definition used `actor_id` and added `actor_label` and `message_custom` fields not present in the PRD summary. The PRD summary was a condensed overview, not an implementation spec.

---

*DOC_CONFLICTS.md · v2.0 · July 2026 · All 8 conflicts resolved · Permanent record — do not remove entries*
