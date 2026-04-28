# Security Deficiency: Weak Protection for Account Actions and Related Security Controls

This document treats the security work as one coursework deficiency. The core problem is that account actions such as signup, login, logout, and account deletion were not protected strongly enough. Broader controls such as security headers, centralized error handling, audit logging, environment checks, and tests are included because they support and verify that same account-security fix.

**Account actions and related security controls were not strong enough.**

## Deficiency

Manual inspection of the original account workflow found several related weaknesses:

- Signup, login, logout, and account deletion were not consistently protected against forged requests.
- Logout used a state-changing `GET` route.
- Login and signup had no route-level rate limiting.
- Signup validation was minimal and spread across route logic.
- Account deletion only required an active session, without password re-authentication.
- Session and environment security checks were weak.
- Errors were handled inconsistently, and security events were not logged in a privacy-aware way.

These issues belong to one deficiency because they affect the same area of the system: protecting account actions from misuse and making those protections reliable.

## Research Rationale

The fix follows common web-security guidance, especially OWASP recommendations for authentication, CSRF prevention, input validation, secure session handling, browser security headers, and security logging. The implementation applies those ideas directly: unsafe account requests require CSRF tokens, login/signup attempts are throttled, user input is validated before database use, session cookies and environment secrets are hardened, account deletion requires password confirmation, and security-relevant events are logged without storing sensitive values.

## Work Implemented

| Area | Work completed | Key files |
| --- | --- | --- |
| CSRF protection | Added session-bound CSRF tokens for unsafe requests; changed logout to `POST`; added hidden `_csrf` fields to signup, login, logout, and account deletion forms. | `src/middleware/csrf.js`, `src/app.js`, `views/signup.ejs`, `views/partials/nav.ejs`, `views/partials/dashboard/*.ejs` |
| Rate limiting | Added route-level limits for login and signup; stores counters in MongoDB by default; returns `429` with `Retry-After` when the limit is exceeded. | `src/middleware/rateLimit.js`, `src/models/rateLimit.model.js`, `src/routes/login.route.js`, `src/routes/signup.route.js` |
| Input validation | Centralized username, email, and password validation; normalized email before lookup; enforced stronger password requirements and bcrypt byte-length protection. | `src/utilities/validation.js`, `src/models/user.model.js`, `src/routes/signup.route.js`, `src/routes/login.route.js` |
| Session and account hardening | Hardened session cookie options; added startup checks for missing or weak secrets; required password re-authentication before account deletion. | `src/utilities/config.js`, `src/app.js`, `views/partials/dashboard/navbar-dashboard.ejs` |
| Related browser protection | Added security headers including CSP, frame protection, content-type protection, referrer policy, and permissions policy; moved inline dashboard script into a static JS file for CSP compatibility. | `src/middleware/securityHeaders.js`, `static/js/dashboard-navbar.js`, `views/partials/dashboard/navbar-dashboard.ejs` |
| Related error handling and audit logging | Added centralized async/error handling; logged account and security events with redaction for passwords, tokens, cookies, CSRF values, secrets, authorization data, and sessions. | `src/middleware/errorHandler.js`, `src/utilities/asyncHandler.js`, `src/utilities/auditLogger.js`, `src/routes/*.js` |

## Verification

Automated tests were added for the main security controls:

- CSRF rejection and valid-token acceptance
- Login/signup rate limiting
- Signup input validation
- Hardened session cookie options
- Required environment configuration checks

Run:

```bash
npm test
```

Manual checks:

- Submit a state-changing request without `_csrf` and confirm it returns `403`.
- Repeat failed login attempts and confirm the route eventually returns `429`.
- Try invalid signup values and confirm they are rejected before account creation.
- Inspect response headers and confirm the configured security headers are present.
- Try account deletion with the wrong password and confirm the account is not deleted.

## Report Wording

Use this as one deficiency in the report:

**Deficiency: Weak Protection for Account Actions and Related Security Controls**

The implementation strengthened account actions such as signup, login, logout, and account deletion by adding CSRF protection, route-level login/signup rate limiting, centralized input validation, hardened session and account-deletion controls, security headers, centralized error handling, and privacy-aware audit logging. These changes should be presented together as one security deficiency fix, with concise before/after code snippets selected from the most important files.
