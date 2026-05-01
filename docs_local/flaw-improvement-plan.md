# Local Flaw Improvement Plan

This file is local-only working memory. It is intentionally ignored by Git through `docs_local/` in `.gitignore`.

## Documentation Split

- `docs/flaw-improvements.md`: final archived improvement record that should be committed and synced.
- `docs_local/flaw-improvement-plan.md`: local planning notes, selection rationale, and next-step reminders.

## Selection Rules

- Pick flaws that are visible in the current source code.
- Avoid duplicating the prior account-security work around registration/login security, CSRF, authentication hardening, validation, rate limiting, error handling, and audit logging.
- Prefer fixes that are small, demonstrable, and covered by focused tests.
- Avoid broad rewrites, new frameworks, or large architecture changes.

## Chosen Items

1. Hardcoded Configuration
   - Local MongoDB fallback used `localhost`, which was unstable on this Windows environment because IPv6 `::1` failed while IPv4 `127.0.0.1` worked.
   - Fix scope: centralize the default URI and use explicit IPv4 loopback.

2. UX/UI Feedback
   - Auth form errors cleared useful non-sensitive input and login errors did not keep the login panel active.
   - Fix scope: pass view state from routes and preserve only username/email, never passwords.

## Verification Reminder

Run:

```bash
npm test
```

Expected current result: 17 passing tests.
