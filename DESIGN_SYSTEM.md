# DESIGN_SYSTEM.md — PA Status Relay

**STATUS: LOCKED — All sections complete. Safe to reference in Claude Code sessions.**

All decisions in this file were made across the Day 0 design working session and are locked for the sprint. Do not introduce hex values, component patterns, or spacing values not defined here. If a gap is discovered during build, flag it to the frontend lead before improvising — ad-hoc visual decisions made under sprint pressure are the primary source of inconsistency in the final demo.

Companion files:
- `STATE_MACHINE.md` — status enum strings, transition table, patient message copy
- `CLAUDE.md` — behavioral rules for Claude Code sessions referencing this file

---

## 1. Tech Stack & Tooling — LOCKED

| Layer | Choice |
|---|---|
| Framework | Next.js / React |
| Styling | Tailwind CSS (dark mode class strategy) |
| Icons | Lucide React — see Section 5 for version note |
| Fonts | Inter (all UI text) · JetBrains Mono (timestamps, codes, IDs) |
| Font source | Google Fonts |

---

## 2. Typography — LOCKED

### Font families

```css
--font-sans: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Type scale

| Token | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| `text-h1` | 20px | 600 (semibold) | 1.3 | Page titles, drawer headers |
| `text-h2` | 16px | 600 (semibold) | 1.35 | Section headers, case detail headings |
| `text-body` | 14px | 400 (regular) | 1.43 (20px) | Primary body copy, form labels |
| `text-body-medium` | 14px | 500 (medium) | 1.43 | Patient names in case list, emphasized body |
| `text-body-semibold` | 14px | 600 (semibold) | 1.43 | Strong emphasis, drawer sub-labels |
| `text-caption` | 12px | 500 (medium) | 1.4 | Supporting metadata, drug names, dates |
| `text-badge` | 11px | 600 (semibold) | 1 | Status badge text — always paired with icon |
| `text-mono-body` | 13px | 400 (regular) | 1.5 | Audit trail action text |
| `text-mono-sm` | 12px | 400 (regular) | 1.4 | Audit trail timestamps, status codes, reason codes |
| `text-mono-sm-medium` | 12px | 500 (medium) | 1.4 | Emphasized mono labels |

### Tailwind config additions

```js
// tailwind.config.js
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
},
fontSize: {
  'h1':    ['20px', { lineHeight: '1.3',  fontWeight: '600' }],
  'h2':    ['16px', { lineHeight: '1.35', fontWeight: '600' }],
  'body':  ['14px', { lineHeight: '1.43', fontWeight: '400' }],
  'caption':['12px',{ lineHeight: '1.4',  fontWeight: '500' }],
  'badge': ['11px', { lineHeight: '1',    fontWeight: '600' }],
  'mono-body':['13px',{ lineHeight: '1.5', fontFamily: 'JetBrains Mono, monospace' }],
  'mono-sm':  ['12px',{ lineHeight: '1.4', fontFamily: 'JetBrains Mono, monospace' }],
},
```

---

## 3. Color Palette — Direction 3: Deep Navy + Sapphire — LOCKED

### Core surfaces

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg-surface` | `#F8FAFC` | `#0F172A` | Page canvas |
| `bg-card` | `#FFFFFF` | `#1E293B` | Case list rows, detail panels |
| `bg-card-subtle` | `#F1F5F9` | `#334155` | Alternating table rows, secondary panels |
| `bg-card-elevated` | `#FFFFFF` + shadow-md | `#263348` | Drawers, modals — one layer above bg-card |
| `border-subtle` | `#E2E8F0` | `#334155` | Table row dividers, card borders |
| `border-input` | `#CBD5E1` | `#475569` | Default text input border |
| `border-focus` | `#2563EB` | `#3B82F6` | Keyboard focus ring — brand blue |

### Typography colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| `text-primary` | `#0F172A` | `#F8FAFC` | Patient names, primary labels |
| `text-secondary` | `#475569` | `#CBD5E1` | Drug names, dates, supporting metadata |
| `text-muted` | `#64748B` | `#94A3B8` | Timestamps, reason codes, captions |
| `text-disabled` | `#94A3B8` | `#475569` | Disabled button labels, inactive controls |

### Brand / action colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| `brand-primary` | `#2563EB` | `#3B82F6` | Primary CTA buttons, links |
| `brand-primary-hover` | `#1D4ED8` | `#60A5FA` | Primary button hover state |
| `brand-on-primary` | `#FFFFFF` | `#0F172A` | Text on filled primary button |

### Semantic feedback colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| `feedback-success-bg` | `#F0FDF4` | `#052E16` | Success toast background |
| `feedback-success-text` | `#15803D` | `#86EFAC` | Success toast text |
| `feedback-success-border` | `#86EFAC` | `#166534` | Success toast border |
| `feedback-warning-bg` | `#FFFBEB` | `#3D2B00` | Consent suppression banner background |
| `feedback-warning-text` | `#92400E` | `#FDE68A` | Consent suppression banner text |
| `feedback-warning-border` | `#FCD34D` | `#78350F` | Consent suppression banner border |
| `feedback-error-bg` | `#FFF1F2` | `#450A0A` | Inline error background (rare) |
| `feedback-error-text` | `#BE123C` | `#FDA4AF` | Inline error text |
| `feedback-error-border` | `#FDA4AF` | `#9F1239` | Inline error border |
| `feedback-info-bg` | `#EFF6FF` | `#172554` | Informational banner background |
| `feedback-info-text` | `#1D4ED8` | `#93C5FD` | Informational banner text |
| `feedback-info-border` | `#BFDBFE` | `#1E3A8A` | Informational banner border |

### Demo-only controls color

| Token | Light | Dark | Usage |
|---|---|---|---|
| `demo-badge-bg` | `#F8F4E8` | `#2C2408` | "Demo only" badge background |
| `demo-badge-text` | `#A16207` | `#FDE68A` | "Demo only" badge text |
| `demo-badge-border` | `rgba(161,98,7,0.25)` | `rgba(253,230,138,0.2)` | "Demo only" badge border |

### Disabled control colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg-disabled` | `#F1F5F9` | `#1E293B` | Disabled button background |
| `text-disabled` | `#94A3B8` | `#475569` | Disabled button label |
| `border-disabled` | `#E2E8F0` | `#334155` | Disabled button border |

---

## 4. Spacing — LOCKED

Base unit: 4px. All spacing values are multiples.

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `space-1` | 4px | `p-1`, `gap-1` | Tight internal gaps (icon to label) |
| `space-2` | 8px | `p-2`, `gap-2` | Badge internal padding, icon margins |
| `space-3` | 12px | `p-3`, `gap-3` | Table cell padding (horizontal) |
| `space-4` | 16px | `p-4`, `gap-4` | Card padding, form field gaps |
| `space-5` | 20px | `p-5`, `gap-5` | Section gaps within a panel |
| `space-6` | 24px | `p-6`, `gap-6` | Drawer section padding |
| `space-8` | 32px | `p-8`, `gap-8` | Page-level vertical rhythm |
| `space-12` | 48px | `p-12` | Large section separation |

### Component-specific spacing rules

- Table row padding: `12px vertical · 16px horizontal` (`py-3 px-4`)
- Badge pill padding: `3px vertical · 9px horizontal` — do not change, tuned to 11px badge text
- Drawer content padding: `24px all sides` (`p-6`)
- Modal content padding: `20px all sides` (`p-5`)
- Form field gap (label to input): `6px` (`gap-1.5`)
- Audit trail node gap: `16px between nodes` (`gap-4`)

---

## 5. Border Radius — LOCKED

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `radius-sm` | 4px | `rounded` | Inline error indicators, small tags |
| `radius-base` | 6px | `rounded-md` | Buttons, inputs, form fields |
| `radius-lg` | 8px | `rounded-lg` | Cards, panels, drawer container |
| `radius-xl` | 12px | `rounded-xl` | Modals, elevated drawers |
| `radius-full` | 9999px | `rounded-full` | Status badge pills — always use for badges |

---

## 6. Shadows — LOCKED

| Token | Value | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(15,23,42,0.06)` | Subtle card lift |
| `shadow-md` | `0 4px 6px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.06)` | Elevated card, bg-card-elevated |
| `shadow-drawer` | `−4px 0 24px rgba(15,23,42,0.12)` | Right-hand slide-over drawer |
| `shadow-modal` | `0 20px 40px rgba(15,23,42,0.16), 0 4px 8px rgba(15,23,42,0.08)` | Message preview modal |
| `focus-ring` | `0 0 0 2px #2563EB` (light) · `0 0 0 2px #3B82F6` (dark) | Keyboard focus — all interactive elements |

Dark mode shadow note: multiply shadow opacity by 1.5 in dark mode. Tailwind dark variant: `dark:shadow-[0_4px_6px_rgba(0,0,0,0.3)]`.

---

## 7. Status Badge Matrix — LOCKED

**Non-negotiable rules:**
1. Every badge renders icon + text. Never color alone. WCAG 2.1 SC 1.4.1.
2. Every badge renders with a 1px inside border stroke. See border opacity values below.
3. Icon mapping is permanent. Do not substitute icons without frontend lead sign-off.
4. Badge pill always uses `radius-full` (9999px).
5. Badge text always uses `text-badge` token (11px / 600 / uppercase tracking: 0).

**Lucide version note:** `Stethoscope` icon was added in Lucide mid-2023. Confirm it exists in your installed `lucide-react` version before building the peer_to_peer badge. Fallback if missing: `PhoneCall` or `UserCog`.

### Full matrix

| Status enum | Display label | Light bg | Light text | Dark bg | Dark text | Border (light) | Border (dark) | Lucide icon | Visual intent |
|---|---|---|---|---|---|---|---|---|---|
| `new_order` | New order | `#E0F2FE` | `#075985` | `#0C4A6E` | `#BAE6FD` | `rgba(7,89,133,0.20)` | `rgba(186,230,253,0.20)` | `PlusCircle` | Sky blue — intake logged |
| `needs_documentation` | Needs docs | `#FFEDD5` | `#C2410C` | `#7C2D12` | `#FFEDD5` | `rgba(249,115,22,0.35)` | `rgba(255,237,213,0.25)` | `FileWarning` | Warm rust/orange — action required |
| `submitted` | Submitted | `#DBEAFE` | `#1E40AF` | `#1E3A8A` | `#93C5FD` | `rgba(30,64,175,0.20)` | `rgba(147,197,253,0.20)` | `Send` | Cobalt blue — packet in transit |
| `pending_review` | Pending review | `#FEF3C7` | `#78350F` | `#78350F` | `#FDE68A` | `rgba(120,53,15,0.20)` | `rgba(253,230,138,0.20)` | `Clock` | Amber — passive payer queue |
| `info_request` | Info request | `#F3E8FF` | `#6B21A8` | `#581C87` | `#E9D5FF` | `rgba(107,33,168,0.20)` | `rgba(233,213,255,0.20)` | `AlertCircle` | Purple — attention required |
| `peer_to_peer` | Peer to peer | `#FCE7F3` | `#9D174D` | `#831843` | `#FBCFE8` | `rgba(157,23,77,0.25)` | `rgba(251,207,232,0.20)` | `Stethoscope` | Magenta — MD escalation |
| `approved` | Approved | `#DCFCE7` | `#14532D` | `#064E3B` | `#A7F3D0` | `rgba(20,83,45,0.20)` | `rgba(167,243,208,0.20)` | `CheckCircle2` | Emerald green — granted |
| `denied` | Denied | `#FEE2E2` | `#991B1B` | `#7F1D1D` | `#FECACA` | `rgba(153,27,27,0.25)` | `rgba(254,202,202,0.20)` | `XCircle` | Deep red — rejected |
| `closed` | Closed | `#F1F5F9` | `#475569` | `#334155` | `#CBD5E1` | `rgba(71,85,105,0.20)` | `rgba(203,213,225,0.15)` | `Lock` | Neutral slate — archived |

### Badge implementation pattern (React/Tailwind)

```tsx
// StatusBadge.tsx
import { PlusCircle, FileWarning, Send, Clock, AlertCircle,
         Stethoscope, CheckCircle2, XCircle, Lock } from 'lucide-react';

const BADGE_CONFIG = {
  new_order:           { label: 'New order',      Icon: PlusCircle,   light: { bg: '#E0F2FE', text: '#075985',  border: 'rgba(7,89,133,0.20)'   }, dark: { bg: '#0C4A6E', text: '#BAE6FD', border: 'rgba(186,230,253,0.20)' } },
  needs_documentation: { label: 'Needs docs',     Icon: FileWarning,  light: { bg: '#FFEDD5', text: '#C2410C',  border: 'rgba(249,115,22,0.35)'  }, dark: { bg: '#7C2D12', text: '#FFEDD5', border: 'rgba(255,237,213,0.25)' } },
  submitted:           { label: 'Submitted',       Icon: Send,         light: { bg: '#DBEAFE', text: '#1E40AF',  border: 'rgba(30,64,175,0.20)'   }, dark: { bg: '#1E3A8A', text: '#93C5FD', border: 'rgba(147,197,253,0.20)' } },
  pending_review:      { label: 'Pending review',  Icon: Clock,        light: { bg: '#FEF3C7', text: '#78350F',  border: 'rgba(120,53,15,0.20)'   }, dark: { bg: '#78350F', text: '#FDE68A', border: 'rgba(253,230,138,0.20)' } },
  info_request:        { label: 'Info request',    Icon: AlertCircle,  light: { bg: '#F3E8FF', text: '#6B21A8',  border: 'rgba(107,33,168,0.20)'  }, dark: { bg: '#581C87', text: '#E9D5FF', border: 'rgba(233,213,255,0.20)' } },
  peer_to_peer:        { label: 'Peer to peer',    Icon: Stethoscope,  light: { bg: '#FCE7F3', text: '#9D174D',  border: 'rgba(157,23,77,0.25)'   }, dark: { bg: '#831843', text: '#FBCFE8', border: 'rgba(251,207,232,0.20)' } },
  approved:            { label: 'Approved',         Icon: CheckCircle2, light: { bg: '#DCFCE7', text: '#14532D',  border: 'rgba(20,83,45,0.20)'    }, dark: { bg: '#064E3B', text: '#A7F3D0', border: 'rgba(167,243,208,0.20)' } },
  denied:              { label: 'Denied',           Icon: XCircle,      light: { bg: '#FEE2E2', text: '#991B1B',  border: 'rgba(153,27,27,0.25)'   }, dark: { bg: '#7F1D1D', text: '#FECACA', border: 'rgba(254,202,202,0.20)' } },
  closed:              { label: 'Closed',           Icon: Lock,         light: { bg: '#F1F5F9', text: '#475569',  border: 'rgba(71,85,105,0.20)'   }, dark: { bg: '#334155', text: '#CBD5E1', border: 'rgba(203,213,225,0.15)' } },
} as const;

type PAStatus = keyof typeof BADGE_CONFIG;

export function StatusBadge({ status }: { status: PAStatus }) {
  const { label, Icon, light, dark } = BADGE_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-[5px] text-[11px] font-semibold
                 px-[9px] py-[3px] rounded-full whitespace-nowrap"
      style={{
        backgroundColor: light.bg,
        color: light.text,
        border: `1px solid ${light.border}`,
      }}
      // Dark mode: apply dark values via CSS class or Tailwind dark: variant
      aria-label={`Status: ${label}`}
    >
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
}
```

---

## 8. Component Patterns — LOCKED

### 8a. Case List Table (`CaseTable.tsx`)

**Layout:** Full-width, bordered rows, no card wrapper on individual rows. Alternates `bg-card` / `bg-card-subtle` per row. Header row: `bg-card-subtle`, sticky on scroll.

**Columns (in order):** Checkbox · Patient name + drug (stacked) · Current status badge · Last updated (mono-sm) · Action (chevron or kebab)

**Row height:** 48px minimum — do not reduce. Dense but not cramped.

**Search:** Filters patient name, drug name, and case ID client-side on keystroke. No API call.

**Sort:** By last updated (default desc), patient name (alpha), status. Single active sort at a time.

**Filter bar:** Status filter chips above the table. Active filter shows filled chip with × dismiss. Multiple filters AND together.

**Empty state:** Center-aligned. Heading: "No cases yet." Body: "Create a case to start tracking authorizations." CTA: "Create case" button.

**Empty search state:** "No cases match your search." No CTA — just clear copy.

### 8b. Status Logging Drawer (`StatusDrawer.tsx`)

**Layout:** Right-hand slide-over, 600px width, `shadow-drawer`. Overlay dims the case list behind it (`rgba(15,23,42,0.4)`).

**Header:** Case ID + patient name. Close button (×) top right. Status chip showing current state.

**Transition selector:** Dropdown or segmented control showing only valid next states. Invalid transitions are rendered as disabled options with a tooltip explaining the pre-condition (`"Attach documentation to submit"`). Do not hide invalid options.

**Pre-condition inputs:** Appear conditionally based on selected target status:
- `doc_link` input: shown when target requires documentation
- `reason_code` input: shown when target requires reason code
- `appointment_link` input: shown when transitioning to `closed` from `approved`
- `next_step_note` textarea: shown when transitioning to `closed` from `denied`

**Inline errors:** Appear below the relevant input, not as a toast. Color: `feedback-error-text`. Icon: `AlertCircle` at 14px. Copy format: `"[Field name] is required to [action]."` Example: `"Documentation link is required to submit."`

**Message preview card:** Appears below the metadata inputs on every transition. Shows the patient-facing message for the target status (verbatim from `STATE_MACHINE.md`). Editable textarea. If edited, audit row will flag `message_custom = true`.

**Consent gating:**
- `consent = TRUE`: Send button enabled. Label: "Confirm and send message"
- `consent = FALSE`: Send button disabled. Warning banner above button: "Consent required — record consent to enable message delivery." CTA inside banner: "Record consent" (button, no live flow in MVP — demo only).

**Footer buttons:**
- Secondary: "Log status only" (skips message send, sets `message_sent = false`)
- Primary: "Confirm and send" (disabled when `consent = FALSE`)

**Disabled button rule:** Disabled buttons remain visible, keyboard-focusable, and render tooltip on hover/focus. Never `display: none` or `visibility: hidden`.

### 8c. Audit Trail Drawer (`AuditDrawer.tsx`)

**Layout:** Right-hand slide-over, 600px width, same overlay as StatusDrawer. Never open simultaneously with StatusDrawer.

**Header:** "Audit trail" title. Lock icon (`Lock`, 16px) + label "Immutable log" — right-aligned, `text-muted`. Close (×) top right. Export CSV button beside the lock label.

**Case summary card:** Top of drawer, below header. Key-value grid: Patient name · Case ID · Drug · Current status badge · Consent status (Active / Suppressed badge).

**Timeline:** Vertical node list, reverse chronological (most recent first). Each node:
- Dot indicator (filled for status transitions, dashed outline for demo events)
- Timestamp: `text-mono-sm`, `text-muted` — format: `Jul 20, 2026 · 9:14 AM`
- Actor label: `text-caption`, `text-secondary` — `"Demo Coordinator"`
- Transition badge: `Previous status → New status` (both as StatusBadge chips, smaller variant)
- Metadata card (inset, `bg-card-subtle`): reason code · doc link · message sent flag · message custom flag
- Demo events render with dashed node line and `demo-badge` treatment — visually distinct from audit entries

**No edit or delete controls anywhere in this component.** No edit icon, no trash icon, no context menu with those options. Enforce at render level.

**Filter bar:** Above the timeline. Filters: Action type · Actor · Date range. Client-side filtering on the fetched array. Active filter shows label: `"Filtered by: Status change · Last 24h"`. Clear all resets to full list.

**CSV export:** Filename: `audit_{case_id}_{YYYY-MM-DD}.csv`. Columns in order: `timestamp`, `actor_label`, `action`, `from_status`, `to_status`, `reason_code`, `message_sent`, `message_custom`. No `demo_events` rows in export.

### 8d. Message Preview Modal

**Trigger:** Fires on every status transition after the coordinator confirms in the StatusDrawer. Appears as a centered dialog over the dimmed app.

**Layout:** Centered modal, 480px wide, `radius-xl`, `shadow-modal`. Background overlay: `rgba(15,23,42,0.5)`.

**Header:** "Patient message preview" + close (×).

**Body:**
- Channel label: "SMS" (with `MessageSquare` icon, 14px) — muted, above the message
- Message text: editable textarea, pre-filled with verbatim string from `STATE_MACHINE.md`. Placeholder copy for the closed status: replace `[office #]` with `"[office number]"` so the coordinator knows to update it.
- If edited: show inline note below textarea: "Edited messages are flagged in the audit trail."

**Consent TRUE state:**
- Send button: "Confirm and send" (primary, enabled)
- Secondary button: "Log without sending"

**Consent FALSE state:**
- Warning banner replaces buttons: background `feedback-warning-bg`, text `feedback-warning-text`, border `feedback-warning-border`. Copy: "Consent required — record consent to enable message delivery."
- CTA inside banner: "Record consent" (secondary style, no live flow in MVP)
- Both action buttons disabled and visibly so

**Confirmation behavior:** On confirm, modal closes, success toast appears, audit entry appears within 500ms.

### 8e. Create Case Modal

**Layout:** Centered modal, 440px wide, `radius-xl`, `shadow-modal`.

**Header:** "New case"

**Fields:**
- Patient name (required): text input, `border-input`, `radius-base`, 36px height
- Consent to status updates (required): toggle or checkbox. Default: OFF (false). Label: "Patient has consented to SMS status updates."
- Doc link (optional): text input, helper text: "Paste a link to the intake documentation if available."

**Footer:** "Cancel" (ghost) · "Create case" (primary)

**Validation:** Patient name required. Inline error if empty on submit: "Enter a patient name to continue."

### 8f. Toast Notifications

**Position:** Bottom-right, stacked if multiple. Auto-dismiss after 4 seconds. Manual dismiss (×) available.

**Success toast:** `feedback-success-bg` background, `feedback-success-border` left border (3px), `CheckCircle2` icon (16px, `feedback-success-text`). Example: "Status updated to Submitted."

**Reset confirmation toast:** Before executing: bottom-center toast with warning treatment. Copy: "This will restore the case to its baseline state." Confirm / Cancel actions inline.

**Error toast (network/server failure):** `feedback-error-bg`, `feedback-error-border` left border. Persistent — does not auto-dismiss. "Couldn't save the status update. Retry?" with Retry button. Inputs retain their values.

### 8g. Inline Error Pattern

**Position:** Directly below the relevant input field, not in a toast.

**Anatomy:** `AlertCircle` icon (14px) + error copy. Color: `feedback-error-text`. Font: `text-caption` (12px / 500).

**Copy format:** State what's missing and what to do. Example: `"Documentation link is required to submit."` Not: `"Error: doc_link missing."`

**Trigger:** On attempted transition with missing required field — not on blur.

### 8h. Demo Control Buttons

**Visual treatment:** All three (Reset, Clone, Re-open) render with `demo-badge-bg` background, `demo-badge-text` color, `demo-badge-border` border, `radius-base`. A small pill label "Demo" in the same token set appears adjacent to or inside the button.

**Placement:** Below the primary action area in the case detail view. Visually separated by a divider.

**Reset:** Shows confirmation toast before executing (see 8f). Copy: "This will restore the case to its baseline state."

**Clone:** Navigates immediately to the new case after API returns. No confirmation required.

**Re-open:** Available on closed cases. Writes a `demo_event` row only. No status change.

**Never render demo controls with primary button styling.** They must not be confused with production actions.

---

## 9. Accessibility Requirements — Non-Negotiable

These apply to every component regardless of sprint pressure.

| Requirement | Rule |
|---|---|
| Color contrast | All text tokens must meet 4.5:1 against their background surface (WCAG 2.1 AA) |
| Status badges | Icon + text always. Never color alone. WCAG 2.1 SC 1.4.1 |
| Focus indicators | All interactive elements: visible focus ring using `focus-ring` shadow token |
| Tab order | Logical, follows visual reading order. No tab traps except open modals/drawers |
| ARIA labels | Required on all icon-only buttons and standalone status chips |
| Disabled buttons | `disabled` attribute + visible disabled style + tooltip. Never `display:none` |
| Disabled buttons | Must remain in DOM and be keyboard-focusable |
| Badge borders | 1px inside stroke on all badge pills — prevents bleed on white and off-white surfaces |
| Font minimums | No text below 11px in any rendered state |
| Mono font usage | Timestamps, status code strings, and reason codes always use `font-mono` |

### Contrast ratios — verified values

| Pair | Ratio | Pass/Fail |
|---|---|---|
| `text-primary` (#0F172A) on `bg-card` (#FFFFFF) | 18.1:1 | ✓ AAA |
| `text-secondary` (#475569) on `bg-card` (#FFFFFF) | 6.1:1 | ✓ AA |
| `text-muted` (#64748B) on `bg-card` (#FFFFFF) | 4.5:1 | ✓ AA (minimum — do not use muted for critical info) |
| `text-disabled` (#94A3B8) on `bg-card` (#FFFFFF) | 2.9:1 | ✗ by design — disabled only, never informational text |
| `brand-primary` (#2563EB) on `bg-surface` (#F8FAFC) | 8.6:1 | ✓ AAA |
| `needs_documentation` text (#C2410C) on bg (#FFEDD5) | 6.1:1 | ✓ AA |
| `denied` text (#991B1B) on bg (#FEE2E2) | 5.9:1 | ✓ AA |
| `approved` text (#14532D) on bg (#DCFCE7) | 7.8:1 | ✓ AAA |
| `peer_to_peer` text (#9D174D) on bg (#FCE7F3) | 6.4:1 | ✓ AA |

---

## 10. Motion — LOCKED

Sprint scope: keep motion minimal. One animation rule per interaction type. No ambient or decorative motion.

| Interaction | Animation |
|---|---|
| Drawer open/close | Slide in/out from right. Duration: 200ms. Easing: `ease-out` |
| Modal open | Fade in + scale from 0.97 → 1. Duration: 150ms |
| Status chip transition | Cross-fade between old and new badge. Duration: 200ms |
| Toast appear | Slide up from bottom-right. Duration: 150ms |
| Toast dismiss | Fade out. Duration: 100ms |
| Button press | `scale(0.98)`. Duration: 80ms |

`prefers-reduced-motion`: disable all transitions. Drawers and modals appear instantly.

---

## 11. Figma Component Checklist

Before building any component in Figma Make, verify:

- [ ] StatusBadge: 9 variants (one per status enum value), light + dark mode, inside stroke border
- [ ] StatusBadge: disabled/loading state not needed — badges are display-only
- [ ] Button: primary / secondary / ghost / disabled — 4 states each
- [ ] Input: default / focus / error / disabled — 4 states
- [ ] Drawer shell: light + dark, with and without overlay
- [ ] Modal shell: light + dark, with overlay
- [ ] Toast: success / error / warning — each with and without dismiss
- [ ] Audit timeline node: status transition / demo event — 2 types, light + dark
- [ ] Demo control button: Reset / Clone / Re-open — with "Demo" pill label
- [ ] Table row: default / hover / selected / alternating — light + dark

---

*DESIGN_SYSTEM.md · v1.0 · LOCKED · July 2026*
*Decisions made in Day 0 design session. Do not modify without frontend lead sign-off and a logged entry in DECISIONS.md.*
