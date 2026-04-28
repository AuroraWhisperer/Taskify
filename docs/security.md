# Security Documentation

This document describes the security improvements implemented in the application, focusing on authentication and account management security hardening.

## Overview

The security enhancements address four key areas of application security:

1. **CSRF Protection** - Prevents cross-site request forgery attacks on state-changing operations
2. **Rate Limiting** - Protects against brute-force attacks on authentication endpoints
3. **Input Validation & Security Headers** - Mitigates XSS risks and enforces secure input handling
4. **Error Handling & Audit Logging** - Provides centralized error management with privacy-aware audit trails

**Note:** The current rate limiter uses MongoDB-backed shared storage by default, so multiple Node.js instances using the same database share the same counters. A memory store is still available for automated tests and small local experiments.

## 1. CSRF Protection

The application generates one CSRF token per session and exposes it to EJS views through `res.locals.csrfToken`.

**Implementation files:**

- `src/middleware/csrf.js`
- `src/app.js`
- `views/signup.ejs`
- `views/partials/nav.ejs`
- `views/partials/dashboard/dashboard-sidebar.ejs`
- `views/partials/dashboard/navbar-dashboard.ejs`

**Key changes:**

- Signup and login forms include a hidden `_csrf` field
- Logout uses `POST /logout` instead of a GET link
- Account deletion uses a POST form with CSRF token
- Requests without valid tokens return `403`
- Token comparison uses `crypto.timingSafeEqual` for timing-attack resistance

**Verification:**

```bash
curl -X POST http://localhost:3000/logout
```

This request should fail with `403` due to missing session token.

## 2. Rate Limiting

Authentication routes implement route-level rate limiting to prevent brute-force attacks.

**Implementation files:**

- `src/middleware/rateLimit.js`
- `src/models/rateLimit.model.js`
- `src/routes/login.route.js`
- `src/routes/signup.route.js`

**Current limits:**

- `POST /login`: 15 attempts per 15 minutes
- `POST /signup`: 10 attempts per 30 minutes

**Behavior:**

- Requests are keyed by IP address, HTTP method, and route path
- Counters are stored in MongoDB with an expiry time for the current rate-limit window
- Successful login resets the login counter to avoid lockout after correct password entry
- When limit is exceeded, returns `429` status with `Retry-After` header

## 3. Input Validation & Security Headers

Server-side validation has been centralized and security headers are applied to all responses.

**Implementation files:**

- `src/utilities/validation.js`
- `src/models/user.model.js`
- `src/middleware/securityHeaders.js`
- `static/js/dashboard-navbar.js`
- `views/partials/dashboard/navbar-dashboard.ejs`

**Validation rules:**

- **Username**: 3-30 characters; letters, numbers, spaces, underscores, and hyphens only
- **Email**: normalized to lowercase and validated against email pattern
- **Password**: minimum 8 characters, must include letter and number, no control characters, maximum 72 bytes (bcrypt limit)

**Security headers applied:**

```text
Content-Security-Policy
X-Content-Type-Options
X-Frame-Options
Referrer-Policy
Permissions-Policy
```

**Note:** Inline dashboard JavaScript was moved to `static/js/dashboard-navbar.js` to comply with CSP restrictions on inline scripts.

## 4. Error Handling & Audit Logging

Centralized error handling and privacy-aware audit logging provide consistent error management and security event tracking.

**Implementation files:**

- `src/middleware/errorHandler.js`
- `src/utilities/asyncHandler.js`
- `src/utilities/auditLogger.js`
- `src/app.js`
- `src/routes/login.route.js`
- `src/routes/signup.route.js`

**Audit logging features:**

- Writes JSON-formatted security events
- Automatically redacts sensitive fields (password, token, secret, cookie, csrf, authorization, session)
- Hashes email and session identifiers for debugging while preserving privacy

**Logged events:**

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

## Testing Checklist

- Start the application with `npm start`
- Verify signup and login pages contain hidden `_csrf` inputs
- Submit POST request without `_csrf` and confirm `403` response
- Attempt repeated failed logins and verify `429` response after limit
- Test invalid signup values and confirm validation rejection
- Inspect response headers and verify security headers are present
- Verify dashboard dropdown JavaScript functionality after refactoring
- Check console logs for login, signup, logout, and failed request events

## Implemented Follow-Up Improvements

The final follow-up items have been implemented in this version:

1. Automated tests were added for validation, CSRF rejection, rate limiting, session cookie options, and environment validation.
2. Session cookie options were hardened with `httpOnly`, `sameSite: "lax"`, production-only `secure`, and a 24-hour expiry.
3. Startup environment checks now reject missing, weak, or default `SESSION_SECRET` values and missing `MONGODB_URI`.
4. Rate-limit counters now use a MongoDB-backed shared store by default, with a memory store kept for tests.
5. Account deletion now requires password re-authentication before the user record is deleted.

Run the automated checks with:

```bash
npm test
```

## Security Review Notes

These notes are included to explain the security design during coursework review. They are not unfinished tasks.

### 1. Rate Limiter Store Choice

The default limiter now stores counters in MongoDB, so multiple Node.js instances that share the same database also share rate-limit state. This is suitable for the current coursework-sized app.

### 2. Environment Secrets Must Stay Private

The repository should never commit a real `.env` file. `.gitignore` excludes `.env`, and `.env.example` is the committed template.

Use a long random `SESSION_SECRET`. If a MongoDB Atlas password or session secret has already been shared or exposed, rotate it.

### 3. Validation Rules Can Be Expanded

Current validation provides useful baseline protection:

- Username length and allowed characters
- Email normalization and pattern validation
- Password length, bcrypt byte-limit, letter and number requirements

### 4. Account Deletion Confirmation

Account deletion is protected by login status, CSRF protection, and server-side password re-authentication. Failed deletion attempts are logged without storing the raw password.

### 5. Security Headers Are Manual

The project sets important security headers manually, including a strict Content Security Policy. If the CSP is changed later, the dashboard should be retested to confirm required scripts and styles still load correctly.
