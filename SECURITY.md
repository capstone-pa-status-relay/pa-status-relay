# Security

This is a public capstone repository. Treat every committed file as visible to anyone.

## Never Commit

- PHI or real patient data
- GitHub tokens or personal access tokens
- Supabase service role keys
- Supabase anon keys with a real project URL
- passwords, demo credentials, or private links
- `.env`, `.env.local`, or other local environment files

## Demo Data

Use fictional, non-identifiable data only. The MVP has no live EHR, payer, SMS, or email integration.

## If A Secret Is Exposed

1. Revoke the secret immediately in the provider console.
2. Create a replacement secret.
3. Notify the team.
4. Remove the secret from code and history before continuing to use the repo.
