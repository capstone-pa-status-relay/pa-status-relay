# UI Design — PA Status Relay
## Design & Build Reference

**name:** ui-design-PA-Status-Relay
**description:** Design intentions, visual language rationale, component decisions, and interaction patterns for the PA Status Relay MVP. Use this as the "why" layer on top of DESIGN_SYSTEM.md (which is the "what/how").

---

## How to use this skill

Load this file when making any UI decision — layout, color, typography, interaction pattern — where the right answer isn't immediately obvious from the token tables in DESIGN_SYSTEM.md.

This file answers: "Why did we choose this pattern?" and "What should this feel like?" DESIGN_SYSTEM.md answers: "What is the exact value to use?"

If these files conflict: DESIGN_SYSTEM.md wins for implementation; this file wins for interpretation.

---

## 1. Design Intent and Product Framing

**What this product is:** A workflow tool for an oncology PA coordinator. Single user, internal demo. The coordinator spends most of their day in EHR systems, insurance portals, and spreadsheets — none of which are particularly designed. This tool needs to feel like a step up.

**The visual goal:** Calm, clinical authority. Not a consumer app, not a startup landing page. Think: a well-designed hospital billing portal or a legal document management system. The coordinator should feel like the interface is working with them, not at them.

**What this is not:** A consumer health app. A patient portal. A colorful SaaS dashboard. No gratuitous gradients, no hero sections, no micro-animations that call attention to themselves.

**Trust signal:** The audit trail panel is the most important surface for reviewers. It must look and feel like a compliance document — monospaced timestamps, clean rows, no decorative chrome, no room for ambiguity about what happened and when.

---

## 2. Color

**Primary palette:**
- Deep Navy (#0A1628) — primary text, strong headings, high-trust surfaces
- Sapphire / Brand Primary (#2563EB) — interactive elements, links, primary CTA (see DESIGN_SYSTEM.md Section 3)
- Slate (#64748B) — secondary text, metadata, placeholder states
- Off-White (#F8FAFC) — page background, low-stimulus resting state

**Why this palette:** Navy and slate signal institutional weight. Sapphire provides interaction affordance without being neon. Off-white reduces eye fatigue during a full day of status updates. No green/red in the primary palette — those colors are reserved for status badges only to prevent semantic drift.

**Status badge colors:** Fully specified in DESIGN_SYSTEM.md. Never introduce new badge colors without updating both DESIGN_SYSTEM.md and STATE_MACHINE.md.

**What to avoid:**
- Teal or purple — they are too consumer-facing for this clinical context
- Bright orange or yellow as primary colors — medical context, not a construction site
- More than one bright color on any surface — pick one focal point

---

## 3. Typography

**Font stack:** Inter (base) + JetBrains Mono (timestamps, codes, IDs)

**Why Inter:** Chosen over IBM Plex Sans and DM Sans in a three-option design session comparison. Inter has tighter letter-spacing and crisper rendering at 11–13px — where case list rows, audit metadata, and status badges live all day. At those sizes, the difference is immediately visible in scan speed. Loaded via Google Fonts.

**Why JetBrains Mono:** High contrast against Inter body text. Ideal for audit trail timestamps and case IDs. Signals precision without leaning into developer-tool aesthetics. Loaded via Google Fonts.

**Type scale (key sizes):**
- Page title / section headers: 18–20px, weight 600
- Table headers: 12px, weight 600, uppercase tracking (0.05em)
- Body / cell text: 14px, weight 400
- Metadata / secondary labels: 12px, weight 400, Slate color
- Timestamps in audit trail: JetBrains Mono, 12px

**Implementation:** Use `fontFamily: "Inter, sans-serif"` for body text. Use `fontFamily: "JetBrains Mono, monospace"` for timestamps and codes. The correct token name in DESIGN_SYSTEM.md is `--font-sans` but direct string values are used throughout the codebase.

**What to avoid:**
- Heading sizes above 24px (this is not a marketing page)
- Any decorative or display typeface
- Sans-serif for timestamps (JetBrains Mono is mandatory for audit trail)

---

## 4. Layout and Spacing

**Core layout:** Fixed 220px left sidebar with a full-height right main content area in a flex row. Root div and aside use explicit inline styles (belt-and-suspenders alongside Tailwind) to guarantee correct layout regardless of Tailwind load order.

**Spacing rationale:** Use the 8-point grid from DESIGN_SYSTEM.md. Every component internal padding and external margin should land on a multiple of 8 (or 4 for micro-spacing). This is not visible to the coordinator but makes the layout feel composed rather than arbitrary.

**Density:** Medium density. The coordinator needs to see 5–10 cases in the list without scrolling. Don't pad rows so generously that it feels like a mobile app. Don't compress so tightly that it feels like a spreadsheet.

**Drawer pattern:** Right-side slide-over at **600px width**. Never full-screen — the coordinator needs to see the case list behind the drawer to maintain context. Overlay dims the list (opacity 0.4) but does not remove it.

**Modal pattern:** Centered overlay. Max-width 480px. Always escape-key dismissable. Never use a modal for information that could live inline. Modal is reserved for: message preview/confirm, destructive action confirmation.

---

## 5. Status Badge Design

Status badges are the primary scan target in the case list. The coordinator reads dozens per hour.

**Design requirements:**
1. Every status must be immediately distinguishable at a glance — don't rely on color alone, use label
2. The label is the primary signal — never abbreviate
3. Icon is optional reinforcement, not the primary signal
4. Badge shapes are **pills** (fully rounded) — consistent with the DESIGN_SYSTEM.md token system

**Color semantics:**
- Blue family (Sapphire tones) — active workflow states (Submitted, Pending Review, Info Request)
- Amber — states requiring coordinator action (Needs Documentation, Peer-to-Peer)
- Green — positive resolution (Approved)
- Red — negative resolution (Denied)
- Gray — terminal/neutral (New Order entry, Closed terminal)
- Orange — return paths that require attention (when returning from a downstream state)

**What to avoid:**
- Using the same color for two different status semantics
- Bright red for anything other than Denied — don't cry wolf
- Custom badge colors for any status not in the STATE_MACHINE.md enum

---

## 6. Interactive States

**Every interactive element needs four states: default, hover, focus, disabled.**

**Disabled state is important:** Invalid transition buttons are disabled, not hidden. The coordinator needs to see what's available and understand why something is unavailable. A disabled button with a tooltip is better than a missing button that leaves the coordinator confused.

**Button hierarchy:**
- Primary (Sapphire #2563EB fill, white text): one per surface maximum. Used for the primary action (Confirm send, Submit transition)
- Secondary (border, Sapphire text): cancel, secondary actions
- Ghost/text: ancillary controls that don't need visual weight (CSV export, "Demo only" controls)

**Hover:** Subtle — darken by ~10%, or shift background opacity. No color shifts that change the semantic meaning of the element.

**Focus ring:** 2px solid Sapphire offset ring. Required for accessibility, even in a demo — it signals craft.

**Transition duration:** 150ms ease for most interactions. 200ms ease for drawer slide-in (slightly slower because it's a larger element traversing more space). Nothing longer — this is a workflow tool, not a portfolio site.

---

## 7. Audit Trail Visual Treatment

The audit trail panel is the most trust-sensitive surface in the product. Design it like a compliance document.

**Row design:**
- Monospaced timestamp left-aligned (12px JetBrains Mono, Slate color)
- Actor label in Slate, weight 400
- Action description in Navy, weight 500 — this is what the reviewer reads first
- Status badges (size="sm") inline for from/to status fields
- No hover states that feel "interactive" — no cursor:pointer unless the row is genuinely clickable
- Row separator: 1px border, very low opacity (0.06 of the border token)

**No edit or delete controls. Ever.** No pencil icon, no trash icon, no context menu. If you are ever in a situation where you think "maybe I should add an edit link here," re-read D01.

**Filter bar:** Should feel like form controls, not navigation. Dropdowns not tabs — tabs imply there is a different "view" of the data, which there isn't.

**CSV export:** Plain text label with download icon. No button chrome. Placed at the top-right of the audit panel header, not in the row actions. The file should open clean in Excel or Numbers — no BOM issues, UTF-8, quoted strings for any cell that might contain commas.

---

## 8. Demo Control Visual Treatment

Demo controls (Reset, Clone, Re-open) must be visually distinct from real workflow actions. Reviewers will be watching the coordinator navigate this UI — demo controls that look like real features will confuse the story.

**Treatment:**
- Grouped in a dedicated section visually separated from the action buttons
- Labeled with a "Demo only" tag or badge (not a real status badge — use a neutral gray treatment with "Demo only" text)
- Lower visual weight than primary actions — ghost button style
- Confirmation required before executing (brief inline confirm, not a full modal)

**What to avoid:**
- Any demo control that could be confused for a real status transition button
- Demo controls in the same button group as real transition buttons
- Demo control styling that matches the status badge color system

---

## 9. Empty States

**No cases:** Centered, illustration optional (keep it minimal — a simple icon, not a drawn scene), short headline, one CTA. Headline: "No cases yet." Body: "Create a case to start tracking authorizations." Primary button.

**No search results:** "No cases match your search. Try a different name, drug, or case ID." No illustration needed — the coordinator understands search. No CTA needed — just clear the confusion.

**Loading state:** Skeleton rows in the table. Don't use a spinner — the table should feel like it's filling in, not like a page reload.

**Error state:** Inline banner at the top of the content area. Short, specific: "Couldn't load cases. Check your connection and try again." Retry button. Never a full-page error for a partial failure.

---

## 10. Things That Aren't In Scope (but you'll be tempted to add)

- Animations beyond the drawer slide-in and subtle hover transitions
- Notification badges or dot indicators on status chips
- Inline editing of case metadata in the case list (editing happens in the drawer)
- A search-as-you-type that hits the API on each keystroke (client-side filter only per D03)
- Responsive / mobile layout (Chrome desktop only, D08)
- Dark mode
- Any icon library beyond the single lucide-react import already in the codebase
- Any additional CSS framework — styling uses **Tailwind CSS utility classes** per D10. No new hex values or component libraries beyond what is already in the codebase.

---

## 11. Figma Reference

The Figma file contains the canonical visual spec for all components listed above. If there is a conflict between this file and the Figma file, raise it — do not resolve it unilaterally.

For implementation: DESIGN_SYSTEM.md is the code-facing authority. Figma is the visual authority. This skill file is the intent authority.

---

*ui-design-SKILL-PA-Status-Relay.md · v1.1 · July 2026 · Corrected to match locked DESIGN_SYSTEM.md (Inter + JetBrains Mono, Tailwind CSS, #2563EB brand primary, pill badges, 600px drawers)*
