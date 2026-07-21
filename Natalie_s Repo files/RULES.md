# Rules — PA Status Relay

Collaborators: Jillian Krebsbach, Natalie Walker, Chris Wozniak, Lee McDonald, mapped to four functional roles per the Build Checklist: **You** (Design/Frontend), **Backend Dev 1**, **Backend Dev 2**, **QA/Slides**. Which person holds which role isn't specified in the source document, confirm before Day 0.

---

## Branch and PR workflow (not in source document — needed for 4 collaborators)

- No one pushes directly to `main`. All work on a feature branch, one branch per unit of work.
- Branch naming: `feature/<short-description>` or `fix/<short-description>`.
- An issue must exist before a PR does, referencing the requirement or Build Checklist item it maps to.
- Every PR description states what changed, why, and links the issue. PRs touching the state machine, transition API, or audit trail flag that explicitly.
- At least one other collaborator reviews and approves before merge. No self-merging.

## Extra review requirement for high-risk areas

Per `CLAUDE.md` Section 5: any change to the state machine transition table requires sign-off from Backend Dev 1 (owns the API) and the Design/Frontend role (owns the UI button logic), with a minimum 2-hour review window before code is written. This is a stated project rule, not an added one.

## Rules directly stated in the source document

- **Schema is locked after Day 1.** The three core tables (`cases`, `audit_trail`, `demo_events`) and the 9-value `pa_status` enum do not change after Day 1 without explicit team sign-off. Changes cascade across both backend devs and frontend simultaneously.
- **Figma tokens and Case List/Details frames locked before Day 0 work begins.** [BLOCKER] per Build Checklist, must be shared with Backend Dev 1 before EOD Day 0 so data shape is confirmed.
- **One Supabase project, one owner** who creates it and invites the other three via Organization Members.
- **No PHI, ever**, in any branch, seed data, commit, or screenshot attached to an issue or PR.
- **No live payer/EHR integration, no production SMS/email**, in this MVP, period.
- **Demo controls write to `demo_events`, never `audit_trail`.** A PR logging a Reset/Clone/Re-open as a status transition is a bug against the spec.
- **Reset strategy (snapshot vs. re-seed) must be decided at Day 2 morning standup** before Backend Dev 2 touches the Reset endpoint. Recommended default: snapshot (Option A). Log the decision in `DECISIONS.md`.
- **Sync points are mandatory, not optional:** Day 1 (You + Backend Dev 1 review schema/data-shape match), Day 2 morning (Reset strategy), Day 3 start (You + Backend Dev 2, 15-minute integration sync on preview modal + audit trail before either builds).
- **[BLOCKER] items must be resolved before the next day's work begins.** Per Build Checklist convention, don't treat a blocker as optional polish.

## What's still undecided (Open Questions, Day 1 kickoff, per Engineering Spec Section 8)

| # | Question | Owner |
|---|---|---|
| 1 | Hosting: Vercel, Netlify, or Supabase hosting? | Backend Dev 1 |
| 2 | Frontend framework: React, Next.js, or plain Vite? | You (Design/FE) |
| 3 | Reset strategy: snapshot vs. re-seed? | Backend Dev 1 + Dev 2 |
| 4 | Demo credentials: how many sets, who gets Day 5 access? | QA/Slides |
| 5 | Browser targets: Chrome only, or also Safari/Firefox? | You (Design/FE) |
| 6 | `actor_label` source: auth.users metadata or hardcode "Demo Coordinator"? | Backend Dev 1 |

Until these are answered, don't assume a default and build against it.
