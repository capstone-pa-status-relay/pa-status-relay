# QA Sign-Off Checklist — PA Status Relay

Aligned to the real 5 seed cases and scenario scripts in `QA_SCENARIOS.md`, which also has its own embedded "Regression Checklist (Day 4 full run)" at the bottom, that one is authoritative for Day 4. This checklist is the Day 5 final sign-off version, tied to the aggregate success metrics.

---

## Assignment

| Scenario | Seed case | Assigned to | Date run | Result |
|---|---|---|---|---|
| 1 — Full happy path | Case 1 (new_order, TRUE) | _______________ | _______ | ☐ Pass ☐ Fail |
| 2 — Docs missing at intake | Case 2 (needs_documentation, TRUE) | _______________ | _______ | ☐ Pass ☐ Fail |
| 3 — Consent gating | Case 3 (pending_review, FALSE) | _______________ | _______ | ☐ Pass ☐ Fail |
| 4 — Payer info request branch | Case 4 (info_request, TRUE) | _______________ | _______ | ☐ Pass ☐ Fail |
| 5 — Peer-to-peer constraint | Case 5 (peer_to_peer, TRUE) | _______________ | _______ | ☐ Pass ☐ Fail |

## Additional checks, run on the hosted URL, not local (per QA_SCENARIOS.md)

- [ ] 500ms audit entry target met on hosted URL
- [ ] Session persists on page refresh
- [ ] Reviewer credentials work in a fresh incognito window
- [ ] CSV export produces a valid file on the hosted URL
- [ ] No PHI visible anywhere in the demo data

## Aggregate result

| Metric | Target | Actual |
|---|---|---|
| Scenarios completed error-free | 100% (5 of 5) | ___ |
| Median time, open case → audit entry | ≤90 seconds | ___ |
| Patient messages passing plain-language review | ≥95% | ___ |
| Reviewers rating demo "useful/feasible" | ≥80% | ___ |

Any scenario that fails gets logged as a known issue with an owner and fix plan before Day 5, not silently re-attempted until it passes.
