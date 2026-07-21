# Mercator Traceability Matrix — PA Status Relay

**Purpose:** Same function as `REGRESSION_TRACEABILITY.md` and `SECURITY_TRACEABILITY.md`, applied to Mercator itself. Distinguishes which parts of Mercator's design trace to an actual project convention (`CLAUDE.md`, `RULES.md`, the PRD) versus which parts were added as general engineering judgment with no source grounding. Mercator checks other artifacts for unsourced claims; it should hold itself to the same standard.

---

## Design choices sourced directly from project documents

| Mercator design choice | Source |
|---|---|
| Runs on every push and PR, not just before Day 5 | `RULES.md`: PRs touching high-risk areas require review "before merge," implying continuous checking, not a one-time end-of-sprint pass |
| Fails the build on P0 gaps, warns (doesn't fail) on P1 by default | Matches the P0/P1 priority convention used throughout the PRD, `REGRESSION_TESTS.md`, and `CLAUDE.md` itself, P0 has always meant "must work," P1 has always meant "should work" |
| Checks coverage independently of any existing test file, starting from the PRD | `MAPPING_AGENT.md`: "Does not start from an already-written scenario file... starts from the requirements themselves" |
| Extracts ACs by parsing literal `[P0]`/`[P1]`/`[P2]` tags | This is literally how the PRD itself is formatted (PRD Section 3) — not an invented convention, a direct read of the existing document structure |
| Flags manifest/tag drift (a test claims to cover something that doesn't exist in the PRD) as a build failure, not a warning | `CLAUDE.md` Section 1: "Ambiguity is a signal, not a default... never silently default to a value or suppress an edge case" — drift is exactly this kind of silent problem if left as a warning |

**5 of Mercator's core design decisions trace directly to an existing project convention.**

## Design choices added as general engineering judgment, no source grounding

| Mercator design choice | Why it was added | Source says anything? |
|---|---|---|
| `@covers:` inline tag convention (rather than a separate manifest file) | Standard practice for keeping test intent next to test code, reduces drift risk | No — this is a new convention introduced for this tool, not found in `CLAUDE.md` or the PRD |
| Fuzzy substring matching (rather than exact string match or semantic matching) | Practical tradeoff: exact matching is too brittle given how often this PRD has been re-pasted; true semantic matching would require an LLM call per check, adding cost and non-determinism to CI | No |
| Test-file glob patterns (`.test.ts`, `.spec.js`, `test_*.py`, etc.) | Covers the realistic candidate frameworks given Q2 (frontend framework) is still undecided per `DECISIONS.md` | No — framework isn't chosen yet, so this is a reasonable guess, not a confirmed convention |
| Exit code scheme (0/1/2) | Standard CI convention (0 = pass, non-zero = fail, distinct codes for distinct failure classes) | No |
| `--strict` flag to optionally fail on P1 gaps | Gives the team a choice rather than forcing one interpretation of how strict P1 enforcement should be | No |

**5 of Mercator's design decisions are engineering judgment calls with no project-document backing.**

---

## What this means

Mercator's own design is roughly **50% sourced, 50% added**, a more even split than either regression or security traceability, because Mercator is new tooling, not a restatement of existing requirements. That's expected and fine, a testing tool is allowed to make reasonable engineering choices, but those choices should be visible as choices, not presented as if the PRD demanded them.

## Real, unresolved dependency

Mercator's test-file scanning assumes a JS/TS-or-Python test stack. **Q2 (frontend framework) is still an open item in `DECISIONS.md`.** If the team picks something with a different test file convention than the ones currently globbed for, the glob patterns in `mercator.py` need to be updated, or code-based coverage will silently detect zero tests without erroring, which would look like "nothing is tested yet" even after real tests exist. This should be revisited the moment Q2 resolves, not discovered later.
