# Acceptance Criteria to Test Specification Mapping - PA Status Relay

**Status:** Pre-implementation traceability. Every PRD Section 3 criterion is mapped to one or more written test specifications. This does not mean the tests are implemented, executed, or passing.

| AC | Priority | Acceptance criterion | Test specification(s) | Current status |
|---|---|---|---|---|
| AC-001 | P0 | View a list of mock PA cases with key metadata | TC-001 | Specified |
| AC-002 | P0 | Search, sort, and filter cases by status, patient name, or date | TC-002 | Specified |
| AC-003 | P0 | Create a case with required fields | TC-003, TC-004 | Specified |
| AC-004 | P1 | Edit existing case metadata | TC-005 | Specified |
| AC-005 | P0 | Select only valid status transitions | TC-006-TC-023, TC-055 | Specified; UI behavior subject to A-04 wording alignment |
| AC-006 | P0 | Block a transition when required metadata is missing and show a specific inline error | TC-007, TC-008, TC-010, TC-012, TC-013, TC-015-TC-019, TC-025-TC-028 | Specified |
| AC-007 | P0 | Create a complete immutable audit entry within 500ms | TC-032, TC-033 | Specified; transaction sequencing subject to A-06-A-08 |
| AC-008 | P1 | Support optional reason code and require it for applicable transitions | TC-010, TC-012, TC-013, TC-015, TC-017, TC-026 | Specified; scope subject to A-01 and A-03 |
| AC-009 | P0 | Show plain-language message preview when consent is true | TC-035, TC-039 | Specified; sequence subject to A-06/A-07 |
| AC-010 | P0 | Disable sending, show consent CTA, and record suppression when consent is false | TC-036, TC-038 | Specified; evidence model subject to A-08 |
| AC-011 | P1 | Flag an edited message in the audit evidence | TC-037 | Specified; revert behavior subject to A-02 |
| AC-012 | P0 | Show a chronological, immutable audit trail with required fields | TC-032, TC-034, TC-040-TC-042 | Partially blocked by A-05 and A-10 |
| AC-013 | P0 | Render no edit or delete controls for audit entries | TC-040-TC-042 | Specified |
| AC-014 | P0 | Filter audit trail by action type, actor, and date range without reload | TC-043 | Specified |
| AC-015 | P1 | Export audit trail CSV with case ID and date in filename | TC-044, TC-045 | Specified |
| AC-016 | P0 | Reset to seeded baseline with confirmation and record a demo event | TC-046 | Blocked by A-09/Q3 |
| AC-017 | P0 | Clone a case as an independent New Order case with an empty audit trail | TC-047 | Specified |
| AC-018 | P1 | Replay a scenario on a clone without changing the original | TC-056 | Specified |

## Coverage statement

All 18 acceptance criteria are mapped to pre-implementation test specifications. Several expected results remain blocked by documented team decisions. No execution or pass/fail claim is made here.

## Ambiguity and decision register

| ID | Question requiring resolution | Affected tests/files |
|---|---|---|
| A-01 | Does the PRD reason-code requirement name only Denied/Info Request transitions, or does the full `STATE_MACHINE.md` gate list control? | TC-010, TC-012, TC-013, TC-015, TC-017, AC-008 |
| A-02 | If message text is edited and then restored before confirmation, is `message_custom` true or false? | TC-037, DECISIONS Q8 |
| A-03 | Is optional `reason_code` available on every transition or only transitions where it is used? | AC-008, transition UI |
| A-04 | Must invalid transitions always remain visible-disabled, or may they be absent? | TC-055, QA Scenario 5 |
| A-05 | Does “chronological” mean oldest-first or most-recent-first? | TC-034, audit UI |
| A-06 | Does the status transition commit before or after message confirmation? | TC-032, TC-035, TC-036 |
| A-07 | If the coordinator skips or closes the message step, does the status transition still commit? | TC-035, TC-057 |
| A-08 | Is message suppression stored on the transition row, as a separate audit row, or in another event record? | TC-036, audit schema |
| A-09 | Which Reset strategy is approved, and what happens to existing audit evidence? | TC-046, DECISIONS Q3 |
| A-10 | Does an audit mutation attempt return 403 from an explicit rejecting route, or 404/405 because no route exists? | TC-041, API contract |

Ambiguities are not to be resolved by QA through assumption. Each resolution should be recorded in `DECISIONS.md`, then reflected in the PRD, state machine, regression specification, and implementation.
