# Acceptance Criteria Implementation Check - PA Status Relay

**Status:** Verified against the current app on `http://127.0.0.1:5173/` and the current implementation in `src/App.tsx` plus supporting frontend utilities. This is an implementation audit, not a spec traceability matrix.

## Verification method

- Read the current PRD requirements in `docs/PA_Status_Relay_PRD.md`.
- Checked the running app in the browser.
- Read the real implementation in `src/App.tsx` and related frontend helpers.
- Did not mark anything Covered unless it was confirmed in the live UI or in the actual current code path.

| AC | Priority | Acceptance criterion | Status | Verification notes |
|---|---|---|---|---|
| AC-001 | P0 | View a list of mock PA cases with key metadata | Partially Covered | The live case list shows mock cases with patient name, drug, status, and last-updated timestamp. The consent column is not a full flag value; false cases show only an icon, true cases show nothing. |
| AC-002 | P0 | Search, sort, and filter cases by status, patient name, or date | Partially Covered | Status chip filtering works and text search works for patient name. There is no sort control, no date filter, and the search implementation checks patient name and drug text, not date. |
| AC-003 | P0 | Create a case with required fields | Partially Covered | The modal includes patient name and consent flag, and patient name is validated. Submitting only logs to the console and closes the modal; no case is created in the visible list. Optional metadata fields are not present. |
| AC-004 | P1 | Edit existing case metadata | Missing | No edit flow is present in the current UI, and no current case-editing handler is wired in the app. |
| AC-005 | P0 | Select only valid status transitions | Partially Covered | The transition dropdown is populated from `getValidTransitions(currentStatus)`, so only valid targets are selectable. Invalid transitions are omitted, not rendered as disabled options. |
| AC-006 | P0 | Block a transition when required metadata is missing and show a specific inline error | Partially Covered | The drawer blocks gated transitions and shows specific inline error text from `getTransitionGate(...)`. The missing piece is that there are no inputs for doc link, reason code, appointment link, or next-step note, so the user cannot satisfy the requirement and complete the transition. |
| AC-007 | P0 | Create a complete immutable audit entry within 500ms | Missing | No real transition write occurs in the current app. The case list uses local `CASES_SEED`, the audit drawer uses static `TIMELINE_NODES`, and confirm actions do not create new audit rows. |
| AC-008 | P1 | Support optional reason code and require it for applicable transitions | Missing | Gate logic exists in `statusMachine.ts`, but the UI has no reason-code input and no way to submit one. |
| AC-009 | P0 | Show plain-language message preview when consent is true | Partially Covered | A message preview modal exists for consent-true cases and shows plain-language text. Confirming the modal does not persist a transition or update the case list or audit trail. |
| AC-010 | P0 | Disable sending, show consent CTA, and record suppression when consent is false | Partially Covered | The drawer disables `Confirm and send` when consent is false. The required consent CTA and suppression audit behavior are not completed in the live flow because the modal is not opened from the disabled state and no suppression event is recorded. |
| AC-011 | P1 | Flag an edited message in the audit evidence | Partially Covered | The preview modal allows message edits, but no real audit entry is created on confirm, so edited messages are never actually flagged in persisted evidence. |
| AC-012 | P0 | Show a chronological, immutable audit trail with required fields | Partially Covered | The app renders an audit drawer with a reverse-chronological timeline and no visible edit/delete affordances. It is not case-specific in the live flow, it is backed by static `TIMELINE_NODES`, and current status actions do not append to it. |
| AC-013 | P0 | Render no edit or delete controls for audit entries | Covered | The audit drawer renders no edit or delete controls in the live UI, and the implementation contains no edit/delete actions for audit rows. |
| AC-014 | P0 | Filter audit trail by action type, actor, and date range without reload | Missing | Filter dropdowns are rendered, but they are static buttons with no filtering state or behavior wired to the timeline. |
| AC-015 | P1 | Export audit trail CSV with case ID and date in filename | Missing | The drawer shows an `Export CSV` button, and a CSV helper exists in `src/backend/auditCsv.ts`, but the button has no click handler and no export occurs in the live app. |
| AC-016 | P0 | Reset to seeded baseline with confirmation and record a demo event | Missing | The current app exposes no Reset control or confirmation flow. A static demo-event row is displayed in the mock audit timeline, but it is not produced by a live reset action. |
| AC-017 | P0 | Clone a case as an independent New Order case with an empty audit trail | Missing | No Clone control or clone workflow is present in the current UI. |
| AC-018 | P1 | Replay a scenario on a clone without changing the original | Missing | No clone support exists in the live app, so replaying a scenario on a clone is also not implemented. |

## Requested spot checks

- Case list fields: the live table currently shows only patient name, medication, status, consent, and last updated. It does not show DOB/age, next action, priority, assigned coordinator, or time-in-status.
- Consent indicator labeling: in the case list, the consent state is icon-only for non-consented cases, with no visible text and no tooltip/title. The icon does have an accessibility label of `Consent required`.
- Transition persistence: confirmed not working. In the live app, clicking `Log status only` closes the drawer but leaves the case row unchanged. In code, the current handlers close UI state or log to the console, but they do not update the selected case status or append a live audit row.

## Summary

The current branch contains a mostly static frontend prototype with some real state-machine helper logic, but the core acceptance criteria around persistence, audit generation, export, demo controls, and full transition completion are not implemented end-to-end yet.
