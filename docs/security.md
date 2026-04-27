# Security Notes

These notes describe the security-related changes in this branch. They are meant to help someone review the code without having to trace every route first.

## Summary

The changes focus on four areas:

- CSRF protection for forms that change server state.
- Rate limiting for login and signup.
- Server-side validation and browser security headers.
- Centralized error handling with audit logs.

This is still a coursework-sized implementation. The rate limiter stores counters in memory, so it is fine for local testing and a single Node process, but it would need Redis or another shared store before running behind multiple server instances.

## CSRF Protection

The app now creates one CSRF token per session and exposes it to EJS views through `res.locals.csrfToken`.

Files involved:

- `src/middleware/csrf.js`
- `src/app.js`
- `views/signup.ejs`
- `views/partials/nav.ejs`
- `views/partials/dashboard/dashboard-sidebar.ejs`
- `views/partials/dashboard/navbar-dashboard.ejs`

What changed:

- Signup and login forms include a hidden `_csrf` field.
- Logout now uses `POST /logout` instead of a GET link.
- Account deletion uses a POST form with a CSRF token.
- Unsafe methods without a valid token return `403`.
- Token comparison uses `crypto.timingSafeEqual`.

Quick check:

```bash
curl -X POST http://localhost:3000/logout
```

The request should fail with `403` because it does not include the session token.

## Rate Limiting

Authentication routes now use a small route-level limiter.

Files involved:

- `src/middleware/rateLimit.js`
- `src/routes/login.route.js`
- `src/routes/signup.route.js`

Current limits:

- `POST /login`: 15 attempts per 15 minutes.
- `POST /signup`: 10 attempts per 30 minutes.

The limiter keys requests by IP, HTTP method, and route path. A successful login resets that login counter, which avoids locking a user out after they finally enter the correct password. When the limit is hit, the route returns `429` and sets a `Retry-After` header.

## Validation And Headers

Signup validation was moved into a utility so the route is not doing all checks inline.

Files involved:

- `src/utilities/validation.js`
- `src/models/user.model.js`
- `src/middleware/securityHeaders.js`
- `static/js/dashboard-navbar.js`
- `views/partials/dashboard/navbar-dashboard.ejs`

Validation rules:

- Username: 3 to 30 characters; letters, numbers, spaces, underscores, and hyphens only.
- Email: normalized to lowercase and checked against a basic email pattern.
- Password: at least 8 characters, includes a letter and a number, no control characters, and no more than 72 bytes for bcrypt.

The app also sets these response headers:

```text
Content-Security-Policy
X-Content-Type-Options
X-Frame-Options
Referrer-Policy
Permissions-Policy
```

Inline dashboard JavaScript was moved into `static/js/dashboard-navbar.js` so the CSP can block inline scripts.

## Error Handling And Audit Logs

Errors now go through shared middleware instead of each route deciding its own fallback behavior.

Files involved:

- `src/middleware/errorHandler.js`
- `src/utilities/asyncHandler.js`
- `src/utilities/auditLogger.js`
- `src/app.js`
- `src/routes/login.route.js`
- `src/routes/signup.route.js`

The audit logger writes JSON-style events and avoids storing raw secrets. Fields matching names such as password, token, secret, cookie, csrf, authorization, or session are redacted. Email and session identifiers are logged as hashes when they are needed for debugging.

Logged events include:

- `login_succeeded`
- `login_failed`
- `signup_succeeded`
- `signup_rejected`
- `csrf_rejected`
- `rate_limit_exceeded`
- `logout_succeeded`
- `account_deletion_requested`
- `account_deleted`
- `account_deletion_failed`
- `route_error`

## Manual Review Checklist

- Start the app with `npm start`.
- Check that signup and login pages contain hidden `_csrf` inputs.
- Submit a POST request without `_csrf` and confirm it returns `403`.
- Try repeated failed logins and confirm the limit eventually returns `429`.
- Try invalid signup values and confirm the form rejects them.
- Check a normal page response and confirm the security headers are present.
- Confirm dashboard dropdown JavaScript still works after moving it to `static/js/dashboard-navbar.js`.
- Check the console logs after login, signup, logout, and failed requests.

## Remaining Work

- Move rate limit state out of memory before deploying across multiple Node processes.
- Add automated tests for CSRF failures, rate limits, and signup validation.
- Review session cookie settings for production, especially `secure` and `sameSite`.
- Consider account lockout or 2FA only if the project scope requires it.
