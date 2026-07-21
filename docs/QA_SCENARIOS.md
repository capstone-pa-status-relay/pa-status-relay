# QA_SCENARIOS.md — PA Status Relay

**5 Scripted Demo Scenarios · MVP Scope · July 2026**

---

**How to use this file**

Each scenario has a named starting state, step-by-step actions, and expected output at each step. Run scenarios in order on Day 5. Use this file for the Day 3 and Day 4 regression runs as well — check off each expected output, don't just eyeball it.

Bug severity:
- **Demo-blocking** — prevents the scenario from completing. Fix before Day 5.
- **Cosmetic** — visible but doesn't break flow. Fix in Day 4 polish if time allows.
- **Nice-to-fix** — noted, deferred to v2.

---

## Scenario 1 — Full Happy Path

**Starting state:** Case 1 · status = `new_order` · consent = TRUE
**Narrative:** Coordinator receives a new order and walks it all the way through to Closed without hitting any blocked paths.

| Step | Action | Expected output |
|---|---|---|
| 1 | Open Case 1 | Status chip shows "New Order". Action buttons show "Needs Documentation" (enabled) and "Submitted" (disabled — no doc_link yet). |
| 2 | Attempt transition to Submitted without doc_link | Button remains disabled. Tooltip: "Attach documentation to submit." |
| 3 | Enter a doc_link URL in the metadata field | "Submitted" button becomes enabled. |
| 4 | Click "Submitted" | Message preview modal opens. Message text: "Your PA request has been submitted and is under insurance review." Send button enabled (consent = TRUE). |
| 5 | Confirm send in modal | Modal closes. Status chip updates to "Submitted". Audit row appears within 500ms: from_status = new_order, to_status = submitted, message_sent = TRUE. |
| 6 | Transition to Pending Review | Message preview modal opens. Message: "Your insurance is reviewing your request. We'll contact you when there's a decision." Confirm. |
| 7 | Audit trail check | Two entries visible. Chronological order. No edit or delete controls present. |
| 8 | Transition to Approved | No pre-condition required. Modal: "Your treatment is approved. Scheduling will contact you next." Confirm. |
| 9 | Attempt transition to Closed without appointment_link | Button disabled. Tooltip: "An appointment link is required to close an approved case." |
| 10 | Enter appointment_link, transition to Closed | Modal: "Your authorization case is complete. For questions, contact [office #]." Confirm. |
| 11 | Verify closed state | No transition buttons enabled. "Closed" is terminal — all action buttons disabled. Audit trail shows full case history. |
| 12 | Export audit trail CSV | Download triggers. Filename: `audit_{case_id}_{YYYY-MM-DD}.csv`. Open file — 5 rows, columns in correct order, no demo_event rows. |

**Pass criteria:** All 12 steps complete without error. CSV downloads and opens correctly.

---

## Scenario 2 — Docs Missing at Intake

**Starting state:** Case 2 · status = `needs_documentation` · consent = TRUE
**Narrative:** Case arrived with missing documentation. Coordinator is blocked until docs are attached — tests metadata enforcement at the most common real-world failure point.

| Step | Action | Expected output |
|---|---|---|
| 1 | Open Case 2 | Status chip shows "Needs Documentation". Only valid transition is "Submitted" — but it is disabled because doc_link is missing. |
| 2 | Attempt to transition to Submitted without doc_link | Inline error appears: "Documentation required before submission. Attach a file or link to continue." Transition does not execute. |
| 3 | Enter doc_link | "Submitted" button becomes enabled. Inline error clears. |
| 4 | Transition to Submitted | Modal opens. Message: "Your PA request has been submitted and is under insurance review." Confirm. |
| 5 | Verify audit row | Audit trail shows entry: from_status = needs_documentation, to_status = submitted, doc_link populated, message_sent = TRUE. |
| 6 | Transition to Pending Review, then back to Needs Documentation (amber return) | On selecting "Needs Documentation" from Submitted, a reason_code field appears and is required. Attempting transition without it shows inline error. |
| 7 | Enter reason_code, complete amber return | Audit row: from_status = submitted, to_status = needs_documentation, reason_code populated. |

**Pass criteria:** All blocking states fire the correct inline errors. Errors clear when the required field is supplied. Amber return path requires reason_code.

---

## Scenario 3 — Consent Gating

**Starting state:** Case 3 · status = `pending_review` · consent = FALSE
**Narrative:** Patient has not given consent. Coordinator updates status — tests that message delivery is suppressed and the suppression event is logged correctly.

| Step | Action | Expected output |
|---|---|---|
| 1 | Open Case 3 | Status chip shows "Pending Review". Consent flag indicator shows FALSE / unconsented state. |
| 2 | Transition to Approved | Message preview modal opens. Message text is visible. **Send button is disabled.** Label: "Consent required — record consent to enable message delivery." CTA button present. |
| 3 | Close modal (do not send) | Status chip updates to "Approved". Audit row: from_status = pending_review, to_status = approved, message_sent = FALSE. |
| 4 | Check audit trail | Entry shows action = "message_suppressed", reason = "no_consent". message_sent = FALSE. No message text logged. |
| 5 | Update consent flag to TRUE on the case | Consent indicator updates. |
| 6 | Transition to Closed (supply appointment_link) | Message preview modal opens. **Send button is now enabled.** Message: "Your authorization case is complete. For questions, contact [office #]." Confirm. |
| 7 | Verify no retroactive send | Audit trail shows message_sent = FALSE on the Approved transition row. message_sent = TRUE only on the Closed transition row. No retroactive sends for prior status changes. |

**Pass criteria:** Send button disabled when consent = FALSE. Suppression event logged. No retroactive messages when consent changes mid-case.

---

## Scenario 4 — Payer Info Request Branch

**Starting state:** Case 4 · status = `info_request` · consent = TRUE
**Narrative:** Payer has requested additional information. Tests the two valid exits from Info Request and confirms reason_code is enforced.

| Step | Action | Expected output |
|---|---|---|
| 1 | Open Case 4 | Status chip shows "Info Request". Valid transitions: "Pending Review" (requires reason_code) and "Submitted" (requires doc_link for re-submit). |
| 2 | Attempt "Pending Review" without reason_code | Inline error: "A reason code is required to return to pending review." Transition blocked. |
| 3 | Enter reason_code, transition to Pending Review | Modal opens: "Your insurance is reviewing your request. We'll contact you when there's a decision." Confirm. Audit row written. |
| 4 | Reset case to info_request baseline using Reset demo control | Confirmation toast appears: "This will restore the case to its baseline state." Confirm. Case returns to info_request. Audit trail rows from steps 1–3 remain visible (Reset does not clear audit trail). demo_events table has a new 'reset' row. |
| 5 | Attempt "Submitted" (re-submit) without doc_link | Inline error: "Documentation required before re-submission." Transition blocked. |
| 6 | Enter doc_link, transition to Submitted | Modal: "Your PA request has been submitted and is under insurance review." Confirm. Audit row: from_status = info_request, to_status = submitted. |

**Pass criteria:** Both Info Request exits work. reason_code and doc_link gates enforce correctly. Reset restores baseline without clearing audit trail. demo_event row written on Reset.

---

## Scenario 5 — Peer-to-Peer Constraint

**Starting state:** Case 5 · status = `peer_to_peer` · consent = TRUE
**Narrative:** A clinical discussion has been requested. Tests that the MVP P2P constraint holds — Peer-to-Peer can only transition to Pending Review, not directly to Approved or Denied.

| Step | Action | Expected output |
|---|---|---|
| 1 | Open Case 5 | Status chip shows "Peer-to-Peer". Only "Pending Review" is shown as an available transition. "Approved" and "Denied" buttons are absent or disabled. |
| 2 | Verify "Approved" and "Denied" are not selectable | Buttons disabled (not hidden). Tooltip if hovered: explains MVP constraint. |
| 3 | Attempt transition to Approved via API directly (if testable) | API returns 400: `{ "error": "invalid_transition", "message": "..." }`. Confirms enforcement is at API level, not just UI. |
| 4 | Enter reason_code, transition to Pending Review | Modal: "Your insurance is reviewing your request. We'll contact you when there's a decision." Confirm. Audit row: from_status = peer_to_peer, to_status = pending_review. |
| 5 | Clone case using Clone demo control | New case created: status = new_order, empty audit trail. App navigates to cloned case immediately. Source case gets demo_event row: event_type = 'clone'. |
| 6 | Return to original Case 5, check audit trail | Audit trail unchanged from step 4. Clone operation did not affect original case's audit trail. |

**Pass criteria:** P2P → Approved and P2P → Denied blocked at both UI and API level. P2P → Pending Review works with reason_code. Clone creates independent case with empty audit trail and does not affect source.

---

## Regression Checklist (Day 4 full run)

Run all 5 scenarios in order. Check each item:

- [ ] Scenario 1 completed — CSV downloaded and verified
- [ ] Scenario 2 completed — all inline errors fired correctly
- [ ] Scenario 3 completed — suppression logged, no retroactive sends
- [ ] Scenario 4 completed — Reset used, both Info Request exits tested
- [ ] Scenario 5 completed — P2P constraint confirmed at API + UI level

**Additional checks (run on the hosted URL, not local):**
- [ ] 500ms audit entry target met on hosted URL
- [ ] Session persists on page refresh
- [ ] Reviewer credentials work in a fresh incognito window
- [ ] CSV export produces valid file on hosted URL
- [ ] No PHI visible anywhere in the demo data

---

*QA_SCENARIOS.md · v1.0 · July 2026*
