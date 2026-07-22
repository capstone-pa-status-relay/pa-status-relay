# CODEX.md - PA Status Relay

Guidelines for using Codex on this project. Codex work should follow the same project contracts as `CLAUDE.md`; this file only clarifies Codex-specific boundaries.

## Read First

Before backend or integration work, read:

- `CLAUDE.md`
- `docs/STATE_MACHINE.md`
- `docs/DECISIONS.md`
- `docs/BUILD_CHECKLIST.md`
- `docs/QA_SCENARIOS.md`
- `docs/REGRESSION_TESTS.md`
- `docs/API_CONTRACT.md`
- `docs/DOC_CONFLICTS.md`, when present on the active branch

If documents conflict, stop and ask the team to resolve the conflict in `DECISIONS.md` before implementation.

## Documentation Source Of Truth

The canonical project documentation lives in `docs/`.

During early setup, the repo had key project documents in the root folder. Later, Natalie's package organized current project documentation into `docs/`, while some root copies remained. Jill's doc updates were merged to `main`, and the matching `docs/` copies were synced afterward, but duplicate root files may still exist temporarily for convenience.

Use `docs/` versions for all project decisions, coding prompts, and contract checks:

- `docs/BUILD_CHECKLIST.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DECISIONS.md`
- `docs/STATE_MACHINE.md`
- `docs/QA_SCENARIOS.md`
- `docs/API_CONTRACT.md`
- `docs/DOC_CONFLICTS.md`
- `docs/REGRESSION_TESTS.md`

Do not edit duplicate root copies directly when a matching file exists in `docs/`. The intended cleanup is to keep root focused on entry files such as `README.md`, `CLAUDE.md`, and `CODEX.md`, then replace duplicate root docs with short pointer/link files that direct readers to `docs/`.

## Codex / Chris Scope

Codex is primarily for Chris's backend application logic, API contracts, integration checks, and GitHub coordination.

Safe Codex-owned surfaces:

- `docs/API_CONTRACT.md`
- backend API route contracts
- status transition validation helpers
- patient message mapping helpers
- API request/response types
- backend unit tests
- GitHub workflow and branch/PR coordination

Avoid editing these unless explicitly requested by the team owner:

- Jill-owned UI/design files
- Natalie-owned QA, Mercator, and README files
- Lebert-owned Supabase schema and seed files
- locked source-of-truth documents such as `docs/STATE_MACHINE.md`

## Non-Negotiables

- `docs/STATE_MACHINE.md` is the source of truth for status values, valid transitions, gates, error codes, display labels, and patient-facing messages.
- Do not change patient-facing message copy unless the team updates `docs/STATE_MACHINE.md`.
- Do not add PHI, real patient data, secrets, tokens, Supabase keys, passwords, or `.env` files.
- Audit trail rows are immutable. No update/delete behavior should be introduced for `audit_trail`.
- Demo controls write to `demo_events`, not `audit_trail`.

## Branch Workflow

Work from the latest `main`:

```text
git switch main
git pull origin main
git switch -c chris/task-name
```

All normal work should go through pull requests. Direct pushes to `main` are setup-only exceptions and should be rare.

## Open Decisions To Respect

Do not hardcode unresolved decisions. Track them as TODOs or contract notes until resolved:

- Q3 Reset strategy
- Q4 Demo credentials
- Q8 `message_custom` behavior when edited text is reverted before confirmation

## Implementation Style

- Keep backend helpers small and testable.
- Prefer explicit transition maps over inferred logic.
- Return API errors using the shared shape:

```json
{
  "error": "error_code",
  "message": "Human-readable string for inline display."
}
```

- Build against mock/synthetic data only.
