# Full Debug Report

Scope: Audit-only pass executed against the live app at http://127.0.0.1:5173, with code verification in the current branch. No application code changes were made.

## Area 1: Case list

### Finding 1.1 [P1] Search does not support date search as required by the acceptance criteria text
- Screen: Cases table
- Steps to reproduce:
1. Open the app at http://127.0.0.1:5173.
2. In Search cases, enter Jul 20, 2026.
3. Observe table body and empty state.
- Expected: Date search should filter by case date values.
- Actual: Search only evaluates patient name and drug fields. Date text does not match those fields; the list enters no-results state.
- Responsible code: [src/App.tsx](src/App.tsx#L1490), [src/App.tsx](src/App.tsx#L1493).

### Finding 1.2 [P1] Sort is not implemented
- Screen: Cases table header
- Steps to reproduce:
1. Open the app at http://127.0.0.1:5173.
2. Click Patient / Drug and Last Updated column headers.
3. Compare row ordering before and after clicks.
- Expected: Clicking sortable headers should change sort order or show sort state.
- Actual: Headers are static labels with no sort handlers.
- Responsible code: [src/App.tsx](src/App.tsx#L1747), [src/App.tsx](src/App.tsx#L1792).

### Finding 1.3 [P0] New case does not create a case
- Screen: Create case modal
- Steps to reproduce:
1. Click New case.
2. Enter patient name QA Test Patient.
3. Click Create case.
4. Return to table and search for QA Test Patient.
- Expected: A new case row should appear.
- Actual: No row is added; create action logs to console and closes modal.
- Responsible code: [src/App.tsx](src/App.tsx#L1523), [src/App.tsx](src/App.tsx#L1525).

### Finding 1.4 [P1] Consent indicator in the case list is icon-only for false consent
- Screen: Cases table, Consent column
- Steps to reproduce:
1. Open the app and inspect rows with consent false (for example Linh Nguyen).
2. Look at the Consent cell content.
- Expected: Visible text label or tooltip in addition to icon for clarity.
- Actual: Only an icon is shown visually; no visible text label is rendered in-cell.
- Responsible code: [src/App.tsx](src/App.tsx#L1888), [src/App.tsx](src/App.tsx#L1891).

## Area 2: Case detail drawer transitions

### Finding 2.1 [P0] Valid transition attempts do not persist to case list
- Screen: Status drawer
- Steps to reproduce:
1. Filter by Submitted.
2. Open the single row.
3. Choose Pending Review.
4. Click Log status only.
5. Compare row status before and after.
- Expected: Row status should update to selected valid target status.
- Actual: Row status remains unchanged.
- Evidence from executed sweep: For every status with valid targets, rowChanged remained false across transition attempts.
- Responsible code: [src/App.tsx](src/App.tsx#L746), [src/App.tsx](src/App.tsx#L750), [src/App.tsx](src/App.tsx#L1477).

### Finding 2.2 [P0] Required metadata gates block transitions but UI has no inputs to satisfy gates
- Screen: Status drawer
- Steps to reproduce:
1. Filter by Needs Documentation.
2. Open the row.
3. Keep Submitted selected.
4. Click Log status only.
- Expected: User should be able to enter required metadata and complete transition.
- Actual: Inline gate error appears, but there are no inputs for doc link, reason code, appointment link, or next-step note in the drawer.
- Responsible code: Gate checks in [src/App.tsx](src/App.tsx#L747), [src/App.tsx](src/App.tsx#L785); no metadata input controls present in drawer body [src/App.tsx](src/App.tsx#L634) through [src/App.tsx](src/App.tsx#L739).

### Finding 2.3 [P0] Transition selection state is stale across cases
- Screen: Status drawer
- Steps to reproduce:
1. Open one case and change selected transition.
2. Close drawer.
3. Open a different case with a different current status.
4. Observe transition selector value.
- Expected: Transition selector should reset based on new current status when a different case is opened.
- Actual: Selector can remain stuck on previous value (for example Needs Documentation), indicating state carry-over.
- Responsible code: selectedTransition initializes from currentStatus only once and is not reset when currentStatus changes [src/App.tsx](src/App.tsx#L531), [src/App.tsx](src/App.tsx#L542).

### Finding 2.4 [P1] Invalid transitions are hidden instead of rendered disabled
- Screen: Status drawer transition dropdown
- Steps to reproduce:
1. Open any case drawer.
2. Open transition dropdown.
3. Compare shown options against full status set.
- Expected: Invalid transitions should be visible and disabled per UI contract wording used elsewhere in project docs.
- Actual: Only valid transitions are shown; invalid transitions are omitted.
- Responsible code: [src/App.tsx](src/App.tsx#L157), [src/App.tsx](src/App.tsx#L198).

## Area 3: Message preview modal

### Finding 3.1 [P0] Confirm path does not persist any transition or audit event
- Screen: Message preview confirm flow
- Steps to reproduce:
1. Trigger confirm flow where button is enabled.
2. Click Confirm and send.
3. Check case row and audit trail.
- Expected: Transition and audit event should be recorded.
- Actual: Handler logs message_sent and closes overlays; no state mutation or audit append occurs.
- Responsible code: [src/App.tsx](src/App.tsx#L2049), [src/App.tsx](src/App.tsx#L2053).

### Finding 3.2 [P1] Consent warning message is only in modal, but consent-false path is blocked before modal opens
- Screen: Status drawer and modal
- Steps to reproduce:
1. Open a consent-false case.
2. Try Confirm and send.
- Expected: Consent warning UX should be consistently visible at the point of block.
- Actual: Confirm button is blocked in drawer; modal warning text is defined in modal-only branch and is often not surfaced during blocked action.
- Responsible code: confirm block at [src/App.tsx](src/App.tsx#L782), [src/App.tsx](src/App.tsx#L788); warning banner is modal-only at [src/App.tsx](src/App.tsx#L463), [src/App.tsx](src/App.tsx#L495).

## Area 4: Audit trail

### Finding 4.1 [P0] Audit trail is static mock content, not per-case live data
- Screen: Audit trail drawer
- Steps to reproduce:
1. Open a case row such as Linh Nguyen.
2. Open audit trail.
3. Repeat after interacting with a different case.
- Expected: Audit summary and timeline should reflect selected case and live history.
- Actual: Summary remains hardcoded (Marcus Okafor, case #1041) and timeline remains fixed.
- Responsible code: hardcoded summary [src/App.tsx](src/App.tsx#L1141), [src/App.tsx](src/App.tsx#L1146); static timeline array [src/App.tsx](src/App.tsx#L915), rendered directly [src/App.tsx](src/App.tsx#L1208).

### Finding 4.2 [P1] Audit filter controls are non-functional placeholders
- Screen: Audit trail filter bar
- Steps to reproduce:
1. Open audit trail.
2. Click Action type, Actor, Date range controls.
- Expected: Filters should update shown timeline entries.
- Actual: Controls are static buttons with no state update behavior.
- Responsible code: [src/App.tsx](src/App.tsx#L827), [src/App.tsx](src/App.tsx#L1187).

### Finding 4.3 [P1] Export CSV button has no action
- Screen: Audit trail header
- Steps to reproduce:
1. Open audit trail.
2. Click Export CSV.
- Expected: CSV download should start.
- Actual: No click handler is wired, no export is triggered.
- Responsible code: button render without onClick [src/App.tsx](src/App.tsx#L1111), [src/App.tsx](src/App.tsx#L1119).

## Area 5: Settings page

### Finding 5.1 [P1] Settings navigation exists but does nothing
- Screen: Left sidebar
- Steps to reproduce:
1. Click Settings in sidebar.
2. Observe URL and main content.
- Expected: Settings route/screen should open or settings state should change.
- Actual: URL remains unchanged and Cases view remains displayed.
- Responsible code: Settings button has no onClick handler [src/App.tsx](src/App.tsx#L1618), [src/App.tsx](src/App.tsx#L1630).

## Area 6: Demo controls

### Finding 6.1 [P0] Reset, Clone, and Re-open controls are not present as actionable UI
- Screen: Main surface and drawers
- Steps to reproduce:
1. Scan main UI controls and drawer controls.
2. Search for buttons labeled Reset, Clone, Re-open.
- Expected: Demo controls should exist and be executable.
- Actual: No actionable Reset/Clone/Re-open buttons are rendered. Only a static timeline label Case reset to baseline appears in mock audit content.
- Responsible code: static demo label in timeline [src/App.tsx](src/App.tsx#L961), [src/App.tsx](src/App.tsx#L1037); only floating demo affordances are Open audit trail and Open status drawer [src/App.tsx](src/App.tsx#L1974), [src/App.tsx](src/App.tsx#L1989).

## Area 7: Accessibility basics

### Finding 7.1 [P1] Escape key does not close status drawer
- Screen: Status drawer dialog
- Steps to reproduce:
1. Open a row drawer.
2. Press Escape.
3. Check whether dialog closes.
- Expected: Escape should dismiss the drawer dialog.
- Actual: Drawer remains open.
- Responsible code: dialog is rendered without Escape key handling [src/App.tsx](src/App.tsx#L1936), and there are no Escape or onKeyDown handlers in file.

### Finding 7.2 [P1] Focus is not trapped in open drawer
- Screen: Status drawer dialog
- Steps to reproduce:
1. Open a row drawer.
2. Press Tab repeatedly.
3. Observe focused elements.
- Expected: Tab order should remain trapped inside active dialog until closed.
- Actual: Focus moves to background table controls such as Select David Mbeki, Select Anna Kowalski, Select Pedro Reyes while drawer is still open.
- Responsible code: drawer is rendered as an absolutely positioned panel without focus-trap logic [src/App.tsx](src/App.tsx#L1936), [src/App.tsx](src/App.tsx#L2007).

## Notes from live execution
- All status filters were exercised in the live UI.
- Transition option sets matched the valid map for statuses present, but persistence did not occur.
- No application code was modified in this pass.
