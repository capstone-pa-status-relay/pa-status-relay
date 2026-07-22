# Laws of UX — PA Status Relay Design & Build Reference

**name:** laws-of-ux-PA-Status-Relay
**description:** Apply the Laws of UX when designing, reviewing, or building any surface in PA Status Relay — the case list, case details, transition controls, message preview modal, audit trail panel, and demo controls. Use proactively for any task involving component design, interaction flows, metadata enforcement UX, consent gating, or design critique. Especially relevant for clinical workflow tools, immutability surfaces, and high-stakes data entry where errors have real downstream consequences.

Source: lawsofux.com by Jon Yablonski. This skill is a condensed, applied reference tailored to this project — for full definitions and citations, see the original site.

---

## How to use this skill

When working on any UI/UX task in PA Status Relay:

1. Identify which laws are most relevant to the surface being worked on (use the quick-reference table below).
2. Apply the relevant heuristics during design/build, not just as post-hoc critique.
3. When reviewing existing designs, explicitly flag violations as part of the critique.
4. For the audit trail and transition controls, pay special attention to the immutability and trust signal sections — these are the highest-leverage surfaces for reviewer credibility on Day 5.

---

## Quick-reference table

| Law | One-line definition | Primary use case |
|---|---|---|
| Jakob's Law | Users expect your product to work like other products they know | Navigation, case list patterns |
| Hick's Law | More/complex choices = slower decisions | Transition button sets, filter menus |
| Fitts's Law | Time to acquire a target depends on its size and distance | Action buttons, tab order, modal CTAs |
| Miller's Law | Working memory holds ~7 (±2) items | Metadata fields per transition, case list columns |
| Cognitive Load | Mental effort required to use an interface | State machine complexity, consent gating |
| Tesler's Law | Complexity can be moved, not eliminated | State machine enforcement, metadata gates |
| Postel's Law | Be liberal in input, strict in output | Metadata validation, patient message copy |
| Gestalt (Proximity, Common Region, Similarity) | Visual grouping shapes perception | Audit trail rows, action button grouping |
| Aesthetic-Usability Effect | Pretty = perceived as more usable | Reviewer credibility, audit trail visual weight |
| Doherty Threshold | <400ms response keeps users in flow | 500ms audit entry target, transition feedback |
| Peak-End Rule | Experience judged by peak + ending | First successful transition, Day 5 run-through |
| Von Restorff Effect | The different item stands out | Denied/approved status chips, consent warning |
| Zeigarnik Effect | Unfinished tasks are remembered more | Consent-missing cases, pending metadata states |
| Goal-Gradient Effect | Effort increases as goal nears | Multi-field metadata enforcement, case completion |
| Serial Position Effect | First/last items remembered best | Case list ordering, audit trail entry order |
| Paradox of the Active User | Users skip docs, learn by doing | Inline metadata hints, disabled button tooltips |

---

## Applied examples by surface — PA Status Relay

These are the highest-leverage applications for this build. Work through these before designing or building any of these surfaces.

---

### Case List

**Jakob's Law:** Coordinators who've used any case management or EHR-adjacent tool expect a sortable list with a status indicator and a patient name as the primary identifier. Don't reinvent this pattern. The case list is not the place to take a design risk — it's the place to get out of the way so coordinators can find and open cases fast.

**Miller's Law:** The case list shows key metadata per row: patient name, status, timestamp, consent flag. That's four things. Don't add more columns to the default view. A coordinator scanning 20 cases should be able to triage in one pass without tracking more than four data points per row.

**Serial Position Effect:** The most urgent cases — those requiring action (Needs Documentation, Info Request) — should sort to the top by default, or at minimum be visually distinguished, since first-position items are remembered and acted on more reliably than mid-list items.

**Zeigarnik Effect:** Cases with missing consent or blocked transitions create productive cognitive tension. Surface a count or indicator for cases that need coordinator attention ("2 cases pending consent") so incomplete work pulls the coordinator back rather than getting lost in a flat list.

---

### Transition Controls (Action Buttons)

**Hick's Law:** A coordinator looking at a case in Pending Review has four possible transitions: Approved, Denied, Info Request, Peer-to-Peer. Presenting all four as equal-weight buttons increases decision time. Apply hierarchy: one primary (filled) button for the most likely next action, secondary (outlined) for the rest. Never make all transitions visually equivalent.

**Tesler's Law:** The state machine has 9 statuses and a complex valid-transition map with pre-condition gates. The coordinator should never have to know this. The UI absorbs the complexity — invalid transitions render as disabled buttons with tooltips explaining the block; valid transitions with unmet pre-conditions render disabled with specific missing-field callouts. The coordinator sees only what's actionable right now.

**Fitts's Law:** This is a keyboard-adjacent workflow. Coordinators processing high-volume caseloads will want to move through cases quickly. Primary action buttons must be large enough to click without precision and positioned consistently across all case states — never move the CTA location between states, even when the set of valid transitions changes.

**Paradox of the Active User:** A coordinator will not read a tooltip explaining why a button is disabled unless they try to click it and are blocked. Disabled buttons with tooltips are correct — but the tooltip must fire on hover, not on click, and must be specific: "Attach documentation to submit" not "This action is unavailable." The explanation must be immediate and diagnostic.

**Von Restorff Effect:** Demo-only controls (Reset, Clone, Re-open) must be visually distinct from production transition controls — not just labeled differently, but placed in a separated section with a muted visual treatment. Reviewers on Day 5 must be able to tell at a glance what's a coordinator action and what's a demo scaffold. If they can't, the demo loses credibility.

---

### Message Preview Modal

**Peak-End Rule:** The message preview modal is the emotional peak of the coordinator's workflow loop. The coordinator has just moved a case forward — now they see exactly what the patient will receive. This moment should feel like confirmation and closure, not a form step. The patient message should be visually prominent (larger text, generous line height, clear visual container), and the "Send update" button should feel like a deliberate, meaningful action — not a routine click-through.

**Postel's Law:** The patient message template is strict on output — nine locked strings, no jargon, no clinical rationale in the Denied message, no payer codes. Be strict. But be liberal on the input side: if a coordinator edits the template, accept the edit, flag it as message_custom = TRUE in the audit trail, and render an "Edited" badge in the modal. Don't block coordinator customization — track it instead.

**Tesler's Law:** The consent flag is a compliance gate. When consent = FALSE, the coordinator sees the modal but the send button is disabled. The complexity being absorbed here is the legal and operational risk of sending a patient message without consent on file. The coordinator doesn't need to understand why this matters — they need to see a clear blocked state with a single CTA: "Record consent to enable message delivery." Don't explain compliance; enforce the gate and give them the next action.

**Cognitive Load:** The modal has one job: confirm that the right message is going to the right patient. Don't add fields, metadata, or navigation to the modal. Channel label (SMS/Portal), message text, send or skip — that's the full interaction. Anything else belongs elsewhere.

**Doherty Threshold:** The modal should appear within 400ms of a confirmed transition. If it doesn't, coordinators will click again or assume the transition failed. The transition and the modal opening are perceived as a single action — latency between them breaks the flow.

---

### Audit Trail Panel

**Aesthetic-Usability Effect:** The audit trail is the primary trust signal for reviewers on Day 5. Its visual design is not decoration — it's evidence. A polished, legible, clearly immutable audit panel signals that the underlying workflow has integrity. A rough or generic-looking trail (gray text on white, no visual rhythm, no clear hierarchy) undermines reviewer confidence in the product regardless of the data inside it. Invest polish here.

**Von Restorff Effect:** Not all audit events are equal. A message_suppressed event (consent missing) and a custom_message event (coordinator edited the template) should be visually distinguished from routine status-change entries. A subtle badge or indicator — not a bright color, but a clear visual difference — ensures reviewers can scan the trail and immediately identify the notable events without reading every row.

**Serial Position Effect:** The audit trail renders in reverse chronological order (most recent first). This is correct — the most recent event is the most relevant, and it gets the first-position memory advantage. Never reverse this to chronological order without an explicit reason.

**Zeigarnik Effect:** A message_suppressed audit entry is an incomplete action — the message that should have been sent wasn't, because consent was missing. This event should be visually distinct in the trail (not just a text description) to create the cognitive pull that prompts a coordinator or reviewer to ask: "Was consent ever resolved?" Incompleteness should be visible, not buried.

**Gestalt (Common Region + Proximity):** Each audit row is a discrete event. Use a left-border rule and a slightly distinct background (--color-audit-immutable) to establish each row as its own contained unit. Don't run rows together with only line height as the separator — coordinators and reviewers need to be able to count events and read individual rows at a glance.

**Cognitive Load / Tesler's Law:** The audit trail's immutability is enforced at three layers (RLS, API, frontend). The frontend's job is to make immutability visually obvious without explaining it. No edit icons, no delete controls, no hover states that suggest editability. A read-only surface should look and feel read-only. The absence of interactive affordances is itself a design decision — protect it.

---

### Metadata Enforcement (Required Fields at Transition)

**Goal-Gradient Effect:** When a coordinator is one field away from completing a transition, they're more motivated to finish than when they're starting. Inline errors that identify the exact missing field ("Attach a documentation link to submit") at the moment of blocking — not before — leverage this effect. Show the path to completion, not a generic error.

**Postel's Law:** Be liberal in accepting metadata inputs — doc links, reason codes, appointment links — in whatever format the coordinator provides. Don't enforce URL structure on doc links in the MVP. But be strict in what gets written to the audit trail: every field stored in the audit row must be present and correctly typed before the transition succeeds.

**Zeigarnik Effect:** A transition that's been attempted but blocked (e.g., missing doc link prevents submission) leaves the coordinator in an incomplete state. The inline error should persist until the field is filled — not auto-dismiss after a few seconds. The incompleteness must remain visible until it's resolved.

**Paradox of the Active User:** Coordinators will not read the field hint explaining what a doc link is until they're blocked from submitting without one. The hint should appear on the input field itself (as persistent helper text, not a tooltip), not just in the error state. Front-load the explanation so the coordinator knows what to prepare before they try to transition.

---

### Consent Gating

**Tesler's Law:** Consent gating is a compliance requirement with real legal weight. The complexity — what consent means, what the downstream risk is, what the regulatory basis is — belongs entirely in the system's enforcement layer. The coordinator's experience should be simple: flag is TRUE, proceed; flag is FALSE, blocked. One decision, not a process.

**Von Restorff Effect:** Cases where consent_flag = FALSE should be visually distinct in the case list — not alarming, but clearly marked. A consent flag indicator (a small badge or icon, not just a column value) makes the exceptional state stand out from the routine. Coordinators processing dozens of cases shouldn't have to read a column value to spot a consent gap.

**Cognitive Load:** Don't explain consent law in the UI. Don't surface what "consent" means or why it's required. Surface only: the flag state, the blocked action, and the next step ("Record consent to enable message delivery"). One sentence. One CTA. Everything else is noise.

---

### Demo Controls (Reset, Clone, Re-open)

**Jakob's Law:** Reviewers on Day 5 come in with a mental model of what a production tool looks like. Demo scaffolding that doesn't announce itself as scaffolding will be mistaken for a production feature. Reset, Clone, and Re-open must be labeled and visually treated as "not real" — not because they don't work, but because they need to be understood as artifacts of the demo context, not the product.

**Hick's Law:** Demo controls increase the total number of choices on the case detail screen. Grouping them in a visually separated section with a clear "Demo only" treatment reduces the cognitive cost of ignoring them for coordinators who are running the actual workflow. Don't let demo controls add decision overhead to the primary flow.

---

### Reviewer-specific UX (Day 5)

The secondary user on Day 5 is an internal reviewer evaluating the demo for feasibility and investment readiness. Their experience follows different laws than the coordinator's.

**Peak-End Rule:** Reviewers will remember the most surprising or impressive moment and the final impression. The most impressive moment should be the first time they see the audit trail populate after a transition — that's the trust signal the whole product is built on. The final impression is the CSV export: a clean, correctly formatted file that could pass a compliance audit. Make both of these moments deliberate.

**Aesthetic-Usability Effect:** Reviewers are evaluating whether to invest in a production build. A polished demo signals that the team can build the production version. A rough demo — even with correct logic — signals risk. Reviewer trust is built through visual credibility before functional credibility.

**Cognitive Load:** Reviewers don't need to understand the state machine to be convinced by the demo. They need to see: a coordinator takes an action, the audit trail updates, the patient message is previewed, consent is gated. Four observable behaviors. Design the demo flow to make all four visible in under 90 seconds.

---

## Review checklist (use when critiquing any PA Status Relay design)

- [ ] Does the case list follow conventions coordinators recognize from other case management tools, or is any deviation intentional and justified? (Jakob's Law)
- [ ] Is the transition button set hierarchically ordered with one clear primary action, or are all transitions visually equal? (Hick's Law)
- [ ] Are primary CTAs large enough to click without precision, positioned consistently across states, and keyboard-reachable? (Fitts's Law)
- [ ] Does any single view ask the coordinator to track more than ~7 things at once? (Miller's Law)
- [ ] Is the state machine complexity fully absorbed by the UI — no invalid options requiring coordinator judgment, no undefined states? (Tesler's Law)
- [ ] Are disabled buttons visible with specific, actionable tooltips — never hidden, never generic? (Paradox of the Active User)
- [ ] Does the message preview modal feel like a deliberate confirmation moment, not a form step? (Peak-End Rule)
- [ ] Is the audit trail visually polished enough that a reviewer would trust the data inside it on first look? (Aesthetic-Usability Effect)
- [ ] Does the audit trail appear within 500ms of a confirmed transition? (Doherty Threshold)
- [ ] Are notable audit events (message suppressed, custom message) visually distinct from routine status-change entries? (Von Restorff Effect)
- [ ] Are cases with missing consent visually flagged in the case list without requiring a column read? (Von Restorff Effect)
- [ ] Is consent gating reduced to one blocked state + one CTA — no compliance explanation, no multi-step consent flow? (Cognitive Load / Tesler's Law)
- [ ] Are demo controls (Reset, Clone, Re-open) visually separated and labeled so reviewers can't mistake them for production features? (Jakob's Law / Hick's Law)
- [ ] Does the audit trail render in reverse chronological order with most recent event in first position? (Serial Position Effect)
- [ ] Is the CSV export — the final artifact of the demo — correctly formatted and visually credible as a compliance artifact? (Peak-End Rule)

---

*laws-of-ux-SKILL-PA-Status-Relay.md · v1.0 · July 2026*
