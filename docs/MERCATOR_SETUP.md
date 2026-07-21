# Mercator Setup - PA Status Relay

Mercator is a deterministic acceptance-criteria traceability checker. It maps
the PRD's tagged requirements to evidence in real automated-test files or real
pre-implementation test specifications. It can fail CI when a P0 requirement has no verified
mapping. It does **not** run tests and does not claim that mapped tests pass.

## Correct repository structure

```text
repository-root/
├── .github/
│   └── workflows/
│       └── mercator.yml
├── mercator/
│   ├── mercator.py
│   └── test_manifest.yaml
├── docs/
│   ├── PA_Status_Relay_PRD.md
│   └── REGRESSION_TESTS.md
└── src/
```

The workflow must be under the repository-root `.github/workflows/` directory.
GitHub will not discover it at `mercator/.github/workflows/mercator.yml`.

## Evidence paths

### Automated tests

Put an `@covers:` declaration beside the real test:

```typescript
// @covers: User can select only valid status transitions from the current state
test("blocks an invalid transition", () => { /* assertions */ });
```

Mercator scans common Jest, Vitest, Playwright, and pytest filenames. Update
`TEST_FILE_GLOBS` if the team chooses a different convention.

### Pre-implementation test specifications

Test-first specifications belong in `docs/REGRESSION_TESTS.md`. Each manifest
entry must include:

```yaml
- id: "TC-001"
  covers: "User can view a list of mock PA cases with key metadata"
  evidence_path: "docs/REGRESSION_TESTS.md"
  evidence_locator: "TC-001"
```

Mercator verifies that both the file and stable `TC-###` locator exist. A
YAML-only assertion cannot make the report pass. This is traceability evidence,
not proof that a test has been implemented, executed, or passed.

## Exit meanings

- `0`: every P0 criterion has verified traceability evidence.
- `1`: one or more required criteria lack verified evidence.
- `2`: configuration, invalid manual evidence, or PRD/test drift was found.

## Known limits

- Mercator maps evidence but does not execute tests.
- A mapping proves declared test intent, not assertion quality.
- Text matching is normalized substring comparison, not semantic reasoning.
- It checks tagged PRD criteria, not untagged Engineering Spec table rows.
- P1 gaps warn by default; `--strict` makes them blocking.

Use the normal project test runner in a separate CI job and protect `main` with
the checks the team collectively agrees to require.
