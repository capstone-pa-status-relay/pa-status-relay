# PA Status Relay

PA Status Relay is a five-day workflow prototype for oncology infusion coordinators. It demonstrates manually logged prior-authorization status transitions, required-metadata enforcement, patient-message previews, consent gating, and immutable audit evidence for infused, buy-and-bill drugs.

**Team:** Jillian Krebsbach, Natalie Walker, Chris Wozniak, Lee McDonald  
**Status:** Pre-implementation MVP demo using synthetic data  
**Important limitation:** No live payer or EHR connection, no PHI, and no production message delivery

## What this prototype validates

- A nine-status authorization workflow and its precondition gates
- A coordinator case list and case-detail experience
- Plain-language message previews with consent-aware controls
- Append-only transition evidence and separate demo events
- Five scripted demo scenarios
- PRD-to-test traceability through Mercator

The prototype does **not** retrieve real-time authorization status. Coordinators enter simulated status changes against synthetic cases. Live payer/EHR integrations, production SMS/email, PHI handling, the appeal path (`denied → submitted`), and direct Peer-to-Peer resolution are deferred.

## Technology decisions

| Layer | Current decision |
|---|---|
| Database, auth, RLS | Supabase/Postgres |
| Front-end framework | Open until recorded in `DECISIONS.md` |
| Design tooling | Figma; repository design rules apply after team approval |
| Development assistants | Claude Code and Codex, subject to repository instructions |
| Hosting | Open until recorded in `DECISIONS.md` |
| Data | Synthetic/mock only |
| Expected concurrency | Approximately 2–4 internal demo users |

Do not treat a choice as locked merely because it appears in a design or instruction file. `DECISIONS.md` records the team's approved choices.

## Roles

| Role | Responsibility |
|---|---|
| Design / Front end | Figma handoff, application shell, coordinator UI, message preview, audit display, accessibility |
| Backend developer 1 | Schema, authentication, transition API, gates, audit API, RLS, hosting |
| Backend developer 2 | Case CRUD, message templates, consent logic, Reset/Clone/Re-open |
| QA / Slides | Test-first regression specifications, AC mapping, Mercator configuration, scenario execution, defects, presentation |

Named assignments should be recorded by the team. Repository documentation should not silently assign work an individual has not accepted.

## Authoritative contracts

- `PA_Status_Relay_PRD.md` defines product scope and acceptance criteria.
- `STATE_MACHINE.md` defines transition rules, gates, error codes, and locked patient-message strings.
- `DECISIONS.md` records approved choices and unresolved questions.
- `REGRESSION_TESTS.md` contains pre-implementation test specifications.
- `AC_MAPPING.md` maps the PRD criteria to those specifications and records ambiguity.
- `QA_SCENARIOS.md` contains the five manual end-to-end scenarios.
- `CLAUDE.md` gives coding assistants project instructions; it is not executable code or an autonomous agent.

If these files conflict, stop and resolve the conflict in `DECISIONS.md` before implementation.

## Test-first workflow

1. Write and review the PRD acceptance criteria.
2. Specify regression tests before implementation.
3. Map each acceptance criterion to stable `TC-###` identifiers.
4. Record ambiguous behavior instead of guessing.
5. Use Mercator to verify that every P0 criterion points to real written evidence.
6. Developers implement executable tests and application behavior.
7. Run automated and manual tests against an identified build.
8. Record Passed, Failed, or Blocked with evidence.

A Mercator pass means traceability exists. It does **not** mean application tests were executed or passed.

## Mercator

Mercator is a deterministic acceptance-criteria traceability checker. It reads the PRD, checks mappings to real test specifications or `@covers:` declarations in test code, reports drift, and can flag missing P0 evidence in CI. It does not call an LLM, change application code, or execute the tests.

Local command after repository paths are confirmed:

```bash
pip install pyyaml
python mercator/mercator.py \
  --prd docs/PA_Status_Relay_PRD.md \
  --test-dir src \
  --manifest mercator/test_manifest.yaml \
  --repo-root .
```

## Local application setup

The exact commands remain provisional until the front-end framework and package scripts are recorded in `DECISIONS.md`. Do not publish framework-specific setup commands before that decision is made.

Environment secrets must remain outside the repository. Commit an `.env.example` containing names only, never live values.

## Success criteria

- Five of five scenarios complete without error
- Median coordinator workflow time is 90 seconds or less
- New audit evidence renders within 500 milliseconds after a successful transition
- No patient-facing message contains prohibited jargon or denial rationale
- At least 80% of reviewers rate the prototype useful/feasible
- Audit CSV structure and contents are verified
- No PHI is present in demo data

## Repository structure

```text
.github/workflows/mercator.yml
docs/
  PA_Status_Relay_PRD.md
  STATE_MACHINE.md
  DECISIONS.md
  DESIGN_SYSTEM.md
  BUILD_CHECKLIST.md
  QA_SCENARIOS.md
  REGRESSION_TESTS.md
  AC_MAPPING.md
  MERCATOR_SETUP.md
  MERCATOR_TRACEABILITY.md
  MERCATOR_INSTRUCTIONS.md
mercator/
  mercator.py
  test_manifest.yaml
src/
supabase/
CLAUDE.md
README.md
```

The workflow file must remain under the repository-root `.github/workflows/` directory. GitHub will not discover it inside `mercator/.github/workflows/`.
