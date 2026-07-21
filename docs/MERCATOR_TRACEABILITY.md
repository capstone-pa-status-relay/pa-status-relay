# Mercator Traceability and Decision Record

## Purpose

Mercator connects tagged PRD acceptance criteria to verifiable test evidence.
It is a deterministic repository tool, not a generative LLM agent and not a
test runner.

## Requirements traced to project artifacts

| Mercator behavior | Project basis |
|---|---|
| Extract `[P0]`, `[P1]`, and `[P2]` criteria | Relay PRD requirement convention |
| Block uncovered P0 criteria | P0 is the project's must-have priority |
| Warn on P1 by default | P1 is treated as should-have rather than release-critical |
| Start from requirements, then locate tests | AC-mapping role described for the project |
| Report PRD/test drift | Prevents silent divergence between promise and verification |

## Engineering choices introduced by Mercator

| Choice | Reason |
|---|---|
| `@covers:` beside automated tests | Keeps test intent adjacent to executable evidence |
| Verified `evidence_path` and `evidence_locator` for manual QA | Prevents manifest-only false coverage |
| Multiline criterion parsing | Preserves criteria wrapped by Markdown/PDF conversion |
| Normalized substring matching | Reproducible and less brittle than exact punctuation matching |
| Exit codes `0`, `1`, and `2` | Separates success, missing coverage, and drift/configuration failures |
| Optional `--strict` | Lets the team decide whether P1 gaps block CI |

## Evidence states

Mercator deliberately distinguishes these states:

1. **Declared** - a mapping claim was written.
2. **Verified mapping** - the claim points to an existing test or manual-QA artifact.
3. **Executed** - a test runner actually ran the test.
4. **Passing** - the execution completed successfully.

Mercator establishes state 2. The project's unit, integration, end-to-end, and
manual QA processes establish states 3 and 4.

## Resolved defects from the first version

- Manual manifest entries can no longer make the report green without a real
  evidence file and locator.
- Wrapped acceptance criteria are joined instead of silently truncated.
- Reports no longer describe a mapping pass as completed test coverage.
- Documentation now consistently treats inline code tags as primary and the
  manual manifest as secondary.
- Workflow placement is documented at repository-root `.github/workflows/`.

## Remaining limitations

- Matching is textual, not semantic.
- A developer can write an inadequate test beside a correct `@covers:` tag;
  code review must assess test quality.
- Mercator does not parse the Engineering Spec's transition tables.
- Framework-specific test globs must be updated if the team uses different
  filenames.
- A GitHub check becomes truly merge-blocking only when branch protection is
  configured by an authorized repository administrator.

## README traceability

The repository README is derivative orientation material, not a separate
requirements source. Its claims are reviewed against this decision record,
`MERCATOR_SETUP.md`, and the executable checker. A separate
`README_TRACEABILITY.md` would duplicate this matrix and is not required.

## Governance recommendation

Run Mercator as an advisory pull-request check first. After the team validates
paths, evidence conventions, and controlled pass/fail examples, the repository
administrator may make it required through branch protection with team
agreement.
