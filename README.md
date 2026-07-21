# PA Status Relay

Practice-side prior authorization status tracking for oncology infusion coordinators. This capstone MVP gives coordinators a structured way to track mock PA cases, enforce status-transition rules, preview patient-facing messages, and preserve an immutable audit trail.

## Project Status

- Capstone/demo build
- Mock data only
- No PHI
- No live EHR, payer, SMS, or email integrations
- Public GitHub repo so the free plan can protect `main`

## Team Workflow

The `main` branch is the stable demo branch and is protected.

Use this flow for all changes:

```text
create branch -> make changes -> open PR -> teammate review -> merge to main
```

Branch naming examples:

```text
feature/case-list-ui
feature/transition-api
feature/audit-export
docs/update-demo-script
fix/consent-preview-state
```

## Core References

- `STATE_MACHINE.md` is the source of truth for statuses, transitions, gates, error codes, and patient-facing copy.
- `CLAUDE.md` defines project-specific implementation rules.
- `BUILD_CHECKLIST.md` defines the 5-day sprint sequence.
- `QA_SCENARIOS.md` defines the demo scenarios.
- `DECISIONS.md` records locked and open decisions.

## Security Rules

Do not commit:

- `.env` or `.env.local`
- Supabase keys or service role keys
- GitHub tokens or personal access tokens
- passwords or demo credentials
- real patient data or PHI

Use `.env.example` for variable names only.

## Planned Stack

- Supabase for Postgres, Auth, and RLS
- Frontend framework: see `DECISIONS.md`
- Hosting: see `DECISIONS.md`

## Local Setup

The runnable app has not been scaffolded yet. Once it exists, keep local setup instructions here current and store secrets in `.env.local`, not in Git.
