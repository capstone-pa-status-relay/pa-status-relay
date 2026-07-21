# Mercator Setup — PA Status Relay

Automated version of the Mercator role described in `MAPPING_AGENT.md`. Runs on every push and PR via GitHub Actions, fails the build if any P0 acceptance criterion in the PRD has zero mapped tests.

## Files

```
mercator/
  mercator.py              the checker itself
  test_manifest.yaml       team-maintained list of tests and what they cover
  .github/workflows/mercator.yml   CI wiring
```

## How it actually works

1. `mercator.py` reads the PRD markdown directly and extracts every line starting with `[P0]`, `[P1]`, or `[P2]` — this is independent of any test file, it goes straight to the source document, same principle as the manual Mercator process.
2. It reads `test_manifest.yaml`, where each real test entry states, in plain language, which requirement it covers.
3. It fuzzy-matches each manifest entry against the extracted ACs (substring matching after normalizing case/punctuation — exact string matching was too brittle given how many times this PRD has already been re-pasted and reformatted in this project).
4. Any P0 AC with zero matched tests fails the build (exit code 1). Any manifest entry that doesn't match any AC at all is flagged as drift (exit code 2), usually means the PRD changed and nobody updated the manifest.

## Team workflow

When you write a real test (unit, integration, or a formalized manual regression case), add one entry to `test_manifest.yaml`:

```yaml
  - id: "TC-019"
    covers: "the exact or closely-paraphrased PRD acceptance criterion text"
```

Do this in the same PR as the test itself, not as cleanup afterward. If you skip it, the next push will still pass (nothing's broken), but coverage silently understates itself, which defeats the entire point.

## Verified working

Tested against the actual PRD in this project: correctly extracted 18 P0/P1 acceptance criteria and confirmed full coverage against a manifest seeded from `REGRESSION_TESTS.md`. Also verified it actually fails: removing one manifest entry (Clone coverage) correctly dropped the build to exit code 1 with the specific gap named and the PRD line number cited.

## Known limitations, said plainly

- **This checks PRD coverage, not Engineering Spec coverage.** The reason-code discrepancy that `AC_MAPPING.md` flagged (PRD names 2 transitions requiring a reason code, the Engineering Spec's actual transition map requires it on 4) won't be caught by this script, because those 4 specific gates aren't literal PRD acceptance-criteria lines, they're rows in the Engineering Spec's transition table, a different document with a different format. This script would need a second parser built specifically for that table to close this gap. Flagging honestly rather than pretending this tool catches everything the manual process catches.
- **Fuzzy matching can produce false positives or negatives** if a manifest entry's `covers` text is too vague or too different in phrasing from the actual PRD line. It's substring-based, not semantic, it won't understand that two differently-worded sentences mean the same thing.
- **This does not run the actual tests.** It only checks that a test *claims* to cover a requirement, it has no way to confirm the test itself is correct or that it actually passes. That's still a human (or a real test runner) job.
- **P1 gaps don't fail the build by default.** Run with `--strict` in the workflow file if you want P1 gaps to block merges too, current setup treats P1 gaps as a warning, matching how P0/P1 priority is treated everywhere else in this project's documents.
