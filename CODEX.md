# CODEX.md - PA Status Relay

Guidelines for using Codex on this project. Codex work should follow the same project contracts as `CLAUDE.md`; this file only clarifies Codex-specific boundaries.

## Read First

Before backend or integration work, read:

- `CLAUDE.md`
- `STATE_MACHINE.md`
- `DECISIONS.md`
- `BUILD_CHECKLIST.md`
- `QA_SCENARIOS.md`
- `docs/REGRESSION_TESTS.md`
- `docs/API_CONTRACT.md`, when present on the active branch

If documents conflict, stop and ask the team to resolve the conflict in `DECISIONS.md` before implementation.

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
- locked source-of-truth documents such as `STATE_MACHINE.md`

## Non-Negotiables

- `STATE_MACHINE.md` is the source of truth for status values, valid transitions, gates, error codes, display labels, and patient-facing messages.
- Do not change patient-facing message copy unless the team updates `STATE_MACHINE.md`.
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
