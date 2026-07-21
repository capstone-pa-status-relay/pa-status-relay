# Mercator - How to Use It

## 1. Install the files

Place:

- `mercator.py` at `mercator/mercator.py`
- `test_manifest.yaml` at `mercator/test_manifest.yaml`
- `mercator.yml` at `.github/workflows/mercator.yml`

Confirm the PRD, test directory, and manual-evidence paths match the repository.

## 2. Map an automated test

Add one comment directly beside a real test:

```typescript
// @covers: User can view a list of mock PA cases with key metadata
test("renders case metadata", () => { /* assertions */ });
```

```python
# @covers: User can Reset a case to its seeded baseline state
def test_reset_restores_baseline():
    ...
```

The text should closely match the PRD wording. Mercator uses normalized
substring matching, not an LLM.

## 3. Map a pre-implementation test specification

Use the manifest only when a test is specified in a real repository file.
Include its path and a locator that Mercator can find inside that file:

```yaml
- id: "TC-016"
  covers: "User can Reset a case to its seeded baseline state"
  evidence_path: "docs/REGRESSION_TESTS.md"
  evidence_locator: "TC-016"
```

If the evidence file or locator does not exist, Mercator fails. This prevents a
list of proposed test IDs from being mistaken for implemented coverage.

## 4. Run locally

```bash
pip install pyyaml
python mercator/mercator.py \
  --prd docs/PA_Status_Relay_PRD.md \
  --test-dir src \
  --manifest mercator/test_manifest.yaml \
  --repo-root .
```

Add `--strict` to make P1 traceability gaps blocking.

## 5. Read the result accurately

- **Verified mapping**: a real test file contains `@covers:`, or a manifest
  entry points to a real regression specification and stable locator.
- **P0 traceability gap**: a required PRD criterion lacks verified evidence.
- **Drift**: evidence claims to cover wording that no longer matches the PRD.
- **Invalid specification evidence**: a manifest claim has no verifiable artifact.

A green Mercator report means the required criteria have traceability evidence.
It does **not** mean the tests were executed or passed. Run the project's test
commands separately.

## 6. Before making it merge-blocking

The team should confirm:

1. The PRD path is correct.
2. Test filename patterns match the selected framework.
3. Manual QA evidence paths exist.
4. Mercator passes and fails on deliberately controlled examples.
5. Branch protection names Mercator as a required check only after agreement.
