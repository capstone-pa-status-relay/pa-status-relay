# Mercator Run History

Purpose: persistent log of Mercator traceability runs for this repository.

## 2026-07-22

### Run 1 - Backend-focused strict traceability check
- Branch: `chore/ac-mapping-regression-mercator` (backend snapshot reviewed against `origin/chris/backend-api-contracts`)
- Command:
  - `python3 mercator/mercator.py --prd docs/PA_Status_Relay_PRD.md --test-dir src/backend --manifest mercator/test_manifest.yaml --repo-root . --strict`
- Result: PASS
- Summary:
  - Total ACs extracted: 18
  - P0 gaps: 0
  - P1 gaps: 0
  - Drift (unmatched mappings): 0
  - Invalid specification evidence: 0
  - Verified specification evidence: 18
  - Code evidence declarations discovered: 0
- Note: traceability pass confirms mapped evidence only; it does not execute implementation tests.

### Run 2 - Current-branch strict traceability check
- Branch: `chore/ac-mapping-regression-mercator`
- Command:
  - `python3 mercator/mercator.py --prd docs/PA_Status_Relay_PRD.md --test-dir src --manifest mercator/test_manifest.yaml --repo-root . --strict`
- Result: PASS
- Summary:
  - Total ACs extracted: 18
  - P0 gaps: 0
  - P1 gaps: 0
  - Drift (unmatched mappings): 0
  - Invalid specification evidence: 0
  - Verified specification evidence: 18
  - Code evidence declarations discovered: 0
- Note: traceability pass confirms mapped evidence only; it does not execute implementation tests.

## Update Template

Use this block for future entries:

```
## YYYY-MM-DD

### Run N - <short label>
- Branch: <branch name>
- Command:
  - <exact command>
- Result: PASS | FAIL
- Summary:
  - Total ACs extracted: <n>
  - P0 gaps: <n>
  - P1 gaps: <n>
  - Drift (unmatched mappings): <n>
  - Invalid specification evidence: <n>
  - Verified specification evidence: <n>
  - Code evidence declarations discovered: <n>
- Notes: <optional>
```
