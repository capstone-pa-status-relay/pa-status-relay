# DOC_CONFLICTS.md — PA Status Relay

Documentation conflicts that would cause the API or frontend to be built inconsistently.
Each conflict names the source documents, quotes the disagreeing statements, states the implementation consequence, and proposes a resolution.

Audited: CLAUDE.md · STATE_MACHINE.md · DESIGN_SYSTEM.md · DECISIONS.md · QA_SCENARIOS.md · PRD (both versions, identical content) · Engineering Spec (embedded in PRD file) · Build Checklist (embedded in PRD file)

---

## C1 — When does the transition API call fire: before or after modal confirmation?

**Documents:** DESIGN_SYSTEM.md (§8b StatusDrawer + §8d Message Preview Modal) vs. QA_SCENARIOS.md

**The conflict:**

DESIGN_SYSTEM.md §8b describes the StatusDrawer with terminal footer buttons that imply the transition commits inside the drawer:
> "Footer buttons: Secondary: 'Log status only' (skips message send, sets `message_sent = false`) · Primary: 'Confirm and send' (disabled when `consent = FALSE`)"

DESIGN_SYSTEM.md §8d then describes a separate Message Preview Modal with its own terminal footer buttons, triggered "after" the drawer:
> "Trigger: Fires on every status transition after the coordinator confirms in the StatusDrawer."
> "Consent TRUE state: Send button: 'Confirm and send' (primary, enabled) · Secondary button: 'Log without sending'"
> "Confirmation behavior: On confirm, modal closes, success toast appears, audit entry appears within 500ms."

QA_SCENARIOS.md Scenario 1 Steps 4–5 place the status update *after* the modal confirm, not after the drawer:
> "Step 4: Click 'Submitted' → Message preview modal opens."
> "Step 5: Confirm send in modal → Modal closes. Status chip updates to 'Submitted'. Audit row appears within 500ms."

QA_SCENARIOS.md Scenario 3 Step 3 shows the status committing on modal *close* (not confirm):
> "Step 3: Close modal (do not send) → Status chip updates to 'Approved'. Audit row: from_status = pending_review, to_status = approved, message_sent = FALSE."

**Implementation consequence:**

If the backend dev puts `POST /transition` at StatusDrawer confirm and the frontend dev triggers it at modal confirm, the integration fails. The Engineering Spec's single request body includes `message_text` and `message_custom` — fields only known after the modal interaction — which implies a single API call after the modal. But the StatusDrawer's "Log status only" button implies the transition can commit without ever opening the modal.

Two specific sub-conflicts:
- Does "Log status only" bypass the modal entirely, or does it open the modal with a non-send intent?
- If the modal fires "on every status transition," why does the StatusDrawer also have final-commit-sounding buttons?

**Resolution:** [NEEDS TEAM DECISION]

Recommended architecture (consistent with Engineering Spec single request body):
- StatusDrawer footer buttons ("Confirm and send" / "Log status only") open or bypass the modal — they do not fire `POST /transition`.
- "Confirm and send" in StatusDrawer → opens Modal → coordinator confirms → `POST /transition` fires with all fields.
- "Log status only" in StatusDrawer → fires `POST /transition` directly with `message_sent = false`, bypassing the modal.
- Modal confirm → fires `POST /transition` with `message_sent = true` and any edited `message_text`.
- The StatusDrawer inline message preview card (§8b) is read-only preview; the modal (§8d) is the editable confirm step.

Team must agree on this architecture before Day 3 begins. Misalignment here is listed as the second-highest risk item in the Build Checklist.

---

## C2 — Audit trail sort order: chronological vs. reverse chronological

**Documents:** PRD (User Journey 2) + QA_SCENARIOS.md + Build Checklist vs. DESIGN_SYSTEM.md + Engineering Spec

**The conflict:**

PRD Section 3, User Journey 2:
> "[P0] User can view a **chronological**, immutable audit trail per case..."

QA_SCENARIOS.md Scenario 1 Step 7:
> "Two entries visible. **Chronological order.** No edit or delete controls present."

Build Checklist (Day 3, Frontend tasks):
> "Audit Trail panel built: **Chronological list** of entries with all required fields"

DESIGN_SYSTEM.md §8c (AuditDrawer):
> "**Timeline:** Vertical node list, **reverse chronological** (most recent first)."

Engineering Spec Section 7 (Frontend Integration Notes):
> "**Audit trail display:** Render in **reverse chronological order** (most recent first)."

**Implementation consequence:**

"Chronological" in standard usage means oldest-first. "Reverse chronological" means newest-first. These produce opposite orderings. The frontend will render one way; QA will check for the other and flag it as a bug on Day 3 or Day 4. The default sort order of the `GET /api/cases/:id/audit` response also depends on this decision.

**Resolution:** [RECOMMEND: Reverse chronological — most recent first]

DESIGN_SYSTEM.md and Engineering Spec are the implementation-authoritative documents and both explicitly define "reverse chronological (most recent first)." PRD and QA_SCENARIOS use "chronological" as a shorthand for "time-ordered" without specifying direction. Reverse-chronological is also the UX convention for audit logs and activity feeds. Update QA_SCENARIOS.md Step 7 and the Build Checklist to say "reverse chronological (most recent first)" to eliminate the ambiguity before QA runs Day 3 regression.

---

## C3 — DESIGN_SYSTEM.md is marked LOCKED but DECISIONS.md Q7 shows it as Open

**Documents:** DESIGN_SYSTEM.md (header) vs. DECISIONS.md (Q7) vs. CLAUDE.md (§9 Open Items)

**The conflict:**

DESIGN_SYSTEM.md header:
> "**STATUS: LOCKED — All sections complete. Safe to reference in Claude Code sessions.**"

DECISIONS.md Q7:
> "**Status:** Open — resolve before Day 1 (Day 0 blocker)"
> "**Question:** Tokens, component library, typography scale — what is locked?"
> "**Constraint:** Do not create DESIGN_SYSTEM.md until tokens are actually decided. A placeholder file with TBDs causes Claude Code to produce inconsistent output."
> "**Resolution:** *(fill in)*"

CLAUDE.md §9 (Open Items table):
> "Q7 | Design system tokens locked → DESIGN_SYSTEM.md created | Frontend Dev | Day 0"
> *(listed as unresolved)*

**Implementation consequence:**

A developer checking DECISIONS.md or CLAUDE.md before starting a session would conclude the design system is not yet locked and either (a) avoid using it, or (b) treat its values as provisional and improvise. CLAUDE.md explicitly says "Do not reference until all sections are marked LOCKED" — pointing at DECISIONS.md as the authority for lock status, which still says Open. This creates a context-dependent inconsistency: developers who read DESIGN_SYSTEM.md first will use it; developers who read DECISIONS.md first will not.

**Resolution:** [RECOMMEND: Close Q7 in DECISIONS.md]

DESIGN_SYSTEM.md is clearly complete and marked LOCKED. Update DECISIONS.md Q7 with a resolution entry (e.g., "Resolved Day 0: DESIGN_SYSTEM.md created and locked. All token, typography, spacing, and component patterns defined. See DESIGN_SYSTEM.md v1.0."). Move Q7 from Open Items to Locked Decisions. Also update CLAUDE.md §9 to remove Q7 from the open items table.

---

## C4 — Frontend framework and styling approach unresolved in CLAUDE.md and DECISIONS.md

**Documents:** DESIGN_SYSTEM.md (§1 Tech Stack) vs. CLAUDE.md (§8 Tech Stack + §9 Open Items) vs. DECISIONS.md (Q2)

**The conflict:**

DESIGN_SYSTEM.md §1:
> "| Framework | Next.js / React |"
> "| Styling | Tailwind CSS (dark mode class strategy) |"

CLAUDE.md §8 (Tech Stack table):
> "| Frontend framework | **[TO FILL IN — Q2 in DECISIONS.md]** |"
> "| Styling | CSS custom properties via `DESIGN_SYSTEM.md` — **lock on Day 0 before any frontend CSS** |"

DECISIONS.md Q2:
> "**Status:** Open — resolve at Day 1 kickoff"
> "**Question:** React + Vite, Next.js, or other?"
> "**Resolution:** *(fill in)*"

**Implementation consequence:**

CLAUDE.md's tech stack table — loaded as behavioral instructions on every Claude Code session — still shows the framework as TBD. Any session that uses CLAUDE.md's tech stack section as context will treat the framework as undecided. Additionally, CLAUDE.md says styling uses "CSS custom properties" but DESIGN_SYSTEM.md chose Tailwind CSS utility classes. These are different implementation patterns: CSS custom properties require `var(--token-name)` references; Tailwind requires utility class names. A developer following CLAUDE.md will write different styling code than one following DESIGN_SYSTEM.md.

Note: DESIGN_SYSTEM.md §2 shows CSS custom property syntax (`--font-sans`, `--font-mono`) alongside Tailwind. The component example in §7 uses inline `style={{}}` with hardcoded hex values rather than Tailwind utility classes. This is an internal inconsistency within DESIGN_SYSTEM.md itself that compounds the conflict.

**Resolution:** [RECOMMEND: Update CLAUDE.md and close DECISIONS.md Q2]

1. Update CLAUDE.md §8 tech stack table to match DESIGN_SYSTEM.md: Next.js / React for framework, Tailwind CSS for styling.
2. Close DECISIONS.md Q2 with the locked decision (Next.js / React + Tailwind CSS).
3. Clarify in DESIGN_SYSTEM.md whether badge/status colors should use Tailwind's `bg-[#hex]` arbitrary values or inline `style={{}}` — the reference component uses inline styles for all colors, which is the pattern to follow consistently.

---

## C5 — Invalid transition button behavior: "absent or disabled" vs. "disabled (not hidden)"

**Documents:** QA_SCENARIOS.md (Scenario 5, Step 1) vs. STATE_MACHINE.md + CLAUDE.md + Engineering Spec + DESIGN_SYSTEM.md

**The conflict:**

STATE_MACHINE.md:
> "Invalid transitions render as **disabled buttons** (not hidden) — reviewers should see the full set of possible actions."

CLAUDE.md §5:
> "Invalid transitions render as **disabled buttons** (not hidden). Tooltip explains why."

Engineering Spec §7:
> "Buttons for invalid transitions are **DISABLED** (not hidden) so reviewers can see the full set of possible actions."

DESIGN_SYSTEM.md §9 (Accessibility):
> "**Disabled buttons** — `disabled` attribute + visible disabled style + tooltip. Never `display:none`"

QA_SCENARIOS.md Scenario 5 Step 1:
> "Only 'Pending Review' is shown as an available transition. 'Approved' and 'Denied' buttons are **absent or disabled**."

QA_SCENARIOS.md Scenario 5 Step 2 (corrects itself):
> "Verify 'Approved' and 'Denied' are not selectable. Buttons **disabled** (not hidden). Tooltip if hovered: explains MVP constraint."

**Implementation consequence:**

"Absent or disabled" in Step 1 creates ambiguity — a developer reading only Step 1 might implement hidden buttons. The four other documents are unanimous: disabled, not hidden. A QA reviewer running Scenario 5 against Step 1 might mark a passing implementation (disabled buttons) as a failure, or vice versa, depending on which step they check first. The Step 1 wording could also lead a developer to hide buttons, which breaks the reviewer UX story and contradicts STATE_MACHINE.md explicitly.

**Resolution:** [RECOMMEND: Update QA_SCENARIOS.md Step 1]

Change "absent or disabled" to "disabled (not hidden)" in Scenario 5, Step 1 to match every other document and eliminate the ambiguity. The behavior is unambiguous everywhere except this one phrase.

---

## C6 — Message preview modal trigger when consent = FALSE

**Documents:** PRD (User Journey 1, Sub-journey: Patient message preview) vs. Engineering Spec (§4b) + QA_SCENARIOS.md

**The conflict:**

PRD Section 3, User Journey 1:
> "[P0] User sees a plain-language message preview modal on every status change **when consent flag is TRUE**."
> "[P0] User sees a **disabled send state** with a consent CTA when consent flag is FALSE; a 'message suppressed — no consent' event is logged to the audit trail."

The PRD requirement implies: modal fires only when consent = TRUE. The consent = FALSE path produces a "disabled send state" — which is not specified as being inside a modal.

Engineering Spec §4b:
> "IF consent_flag = FALSE: → **Show preview modal** BUT disable send button"

QA_SCENARIOS.md Scenario 3 Step 2:
> "Transition to Approved → **Message preview modal opens.** Message text is visible. Send button is disabled."

**Implementation consequence:**

If a developer follows the PRD, they build the consent=FALSE path as a warning banner or inline state (no modal). If they follow the Engineering Spec and QA, they build a modal that opens every time, with send disabled inside it. These are different UI components with different rendering logic, different z-index behavior, and different aria semantics.

The suppression audit event ("message_suppressed") must fire in either case — but when it fires differs:
- PRD path: the event fires without a modal (coordinator never sees a modal when consent=FALSE)
- Engineering Spec path: the event fires when the modal is dismissed or when "Log without sending" is clicked

**Resolution:** [RECOMMEND: Follow Engineering Spec and QA — modal fires on every transition]

The Engineering Spec and QA_SCENARIOS are the implementation authorities and are consistent with each other. The modal-on-every-transition design is also correct for the demo: reviewers need to see the consent gating in action, and a modal makes the suppression event visible. The PRD wording is a simplified summary that omits the consent=FALSE modal behavior. The audit suppression event should fire when the modal is dismissed or "Log without sending" is clicked in the consent=FALSE state.

---

## C7 — Consent suppression warning banner copy: three different strings

**Documents:** DESIGN_SYSTEM.md (§8b StatusDrawer) vs. DESIGN_SYSTEM.md (§8d Message Preview Modal) vs. QA_SCENARIOS.md (Scenario 3 Step 2)

**The conflict:**

DESIGN_SYSTEM.md §8b (StatusDrawer, consent=FALSE banner):
> "Warning banner above button: '**Message suppressed — patient has not consented to status updates.**'"

DESIGN_SYSTEM.md §8d (Message Preview Modal, consent=FALSE banner):
> "Copy: '**Message suppressed — record patient consent to enable delivery.**'"

QA_SCENARIOS.md Scenario 3 Step 2 (expected output):
> "Label: '**Consent required — record consent to enable message delivery.**'"

**Implementation consequence:**

Patient-facing and coordinator-facing copy is locked per CLAUDE.md §1: "Patient-facing message copy is locked." While this banner is coordinator-facing (not patient-facing), the QA step describes a specific expected string. If the implementation uses either of the DESIGN_SYSTEM.md strings, QA Step 2 will fail the expected output check. The three strings also convey different concepts: §8b implies the message was already suppressed; §8d is instructional; QA is a capability label.

**Resolution:** [NEEDS TEAM DECISION]

Decide the single canonical string for this banner before Day 3 build. The QA scenario expected output is the riskiest source of truth because it determines pass/fail on Day 5. Recommend aligning on one string and updating DESIGN_SYSTEM.md §8b, §8d, and QA_SCENARIOS.md Scenario 3 Step 2 to match. Suggested canonical: the QA string ("Consent required — record consent to enable message delivery.") because it is actionable, not a statement of past suppression.

Note: also resolve whether this banner appears in the StatusDrawer, in the Modal, or both. §8b puts it in the drawer; §8d puts it in the modal. C1 resolution will determine which surface is active.

---

## C8 — Audit schema field: `user_id` vs. `actor_id`

**Documents:** PRD (Appendix, Audit Schema) vs. Engineering Spec (§2c, audit_trail table)

**The conflict:**

PRD Appendix (audit schema summary):
> "Audit Schema (written on every status transition): `{ case_id, from_status, to_status, **user_id**, timestamp, reason_code, doc_link, message_sent }`"

Engineering Spec §2c (actual table definition):
> "`actor_id` UUID NOT NULL REFERENCES auth.users(id)"
> "`actor_label` TEXT NOT NULL"

The PRD uses `user_id`; the Engineering Spec uses `actor_id`. The PRD schema also omits `actor_label`, `message_text`, and `message_custom`.

**Implementation consequence:**

Minor but concrete: if a developer uses the PRD schema as reference for API response shape or Supabase queries, they will reference `user_id` instead of `actor_id` and miss the `actor_label` column. The `actor_label` field matters for the CSV export (it's a required column: `actor_label`), for the audit trail display ("Demo Coordinator"), and for the open question Q6 about how to populate it.

**Resolution:** [RECOMMEND: Engineering Spec §2c is authoritative]

The Engineering Spec is the implementation document; the PRD schema is a condensed summary. Use `actor_id` and `actor_label` everywhere. No code change needed — just confirm no one is using `user_id` as a column name. This distinction should also be noted in the Day 1 standup schema review checklist item.

---

## Summary Table

| # | Conflict | Documents | Severity | Resolution type |
|---|---|---|---|---|
| C1 | Transition API fires before or after modal confirm | DESIGN_SYSTEM.md §8b vs. §8d vs. QA_SCENARIOS | **Demo-blocking** | [NEEDS TEAM DECISION] |
| C2 | Audit trail sort order: chronological vs. reverse-chrono | PRD + QA vs. DESIGN_SYSTEM + Eng Spec | **Demo-blocking** | [RECOMMEND: Reverse-chrono] |
| C3 | DESIGN_SYSTEM.md lock status | DESIGN_SYSTEM.md vs. DECISIONS.md Q7 | High — blocks session trust | [RECOMMEND: Close Q7] |
| C4 | Framework and styling approach undecided per CLAUDE.md | DESIGN_SYSTEM.md vs. CLAUDE.md vs. DECISIONS.md Q2 | High — affects Day 1 scaffold | [RECOMMEND: Update CLAUDE.md + close Q2] |
| C5 | Invalid transition buttons: "absent or disabled" | QA_SCENARIOS Scenario 5 Step 1 vs. all others | Medium — QA pass/fail risk | [RECOMMEND: Fix QA Step 1 wording] |
| C6 | Modal fires when consent=FALSE | PRD vs. Engineering Spec + QA | **Demo-blocking** | [RECOMMEND: Follow Eng Spec + QA] |
| C7 | Consent suppression banner copy: 3 different strings | DESIGN_SYSTEM.md §8b vs. §8d vs. QA | High — QA pass/fail risk | [NEEDS TEAM DECISION] |
| C8 | Audit schema field: `user_id` vs. `actor_id` | PRD vs. Engineering Spec | Low — naming only | [RECOMMEND: Eng Spec is authoritative] |

---

*DOC_CONFLICTS.md · July 2026 · Conflicts audited pre-implementation · Resolve before Day 1 code begins*
