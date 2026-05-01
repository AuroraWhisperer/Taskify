# Report DLI Notes

This file is local-only writing support for the separate coursework report. It should not be committed.

## Deficiency 1: Hardcoded Configuration

### Detection

During local startup testing, the web application reported MongoDB connection failure even though the Windows `MongoDB` service was running and port `27017` was reachable. Further checks showed that `localhost` attempted IPv6 `::1`, while MongoDB was reachable through IPv4 `127.0.0.1`. The source fallback in `src/db/conn.js` used `mongodb://localhost:27017/taskify`.

Suggested report framing:

- This is not a leaked credential or secret.
- Frame it as configuration reliability and environment portability.
- The flaw is that a source-level default encoded an environment-sensitive host name, creating fragile local deployment behavior.

### Literature

Useful sources:

- Yin et al. (2011), SOSP: empirical study of 546 real-world misconfigurations. Key angle: parameter mistakes are common and can cause crashes, hangs, or severe degradation.
- Xu et al. (2016), OSDI: early configuration checking reduces failure damage. Key angle: configuration errors should be detected or made safer before runtime failure.
- Optional supporting engineering standard: The Twelve-Factor App config principle says environment-specific config should be separated from code. This is useful as an engineering benchmark, but the coursework asks for research articles, so do not rely on it as the only citation.

### Implementation

Implemented change:

- Added `DEFAULT_LOCAL_MONGODB_URI = "mongodb://127.0.0.1:27017/taskify"`.
- Added `getLocalMongoUri(env)` so the default is testable and still overridable.
- Kept `LOCAL_MONGODB_URI` as the first-priority override.
- Added `test/db-config.test.js`.

Report evidence:

- Before: `uri: () => process.env.LOCAL_MONGODB_URI || "mongodb://localhost:27017/taskify"`.
- After: centralized default with explicit IPv4 loopback.
- Test: `local MongoDB default uses explicit IPv4 loopback`.

## Deficiency 2: UX/UI Feedback

### Detection

Manual inspection of the shared signup/login page showed that failed submissions rendered `signup.ejs` with only an `error` value. This caused useful non-sensitive user input to be lost. Login errors also returned to the default signup panel rather than leaving the user on the login panel.

Suggested report framing:

- This matches the guideline's UX missing feedback example.
- Emphasize correction workflow: users need to see the error, remain in the task context, and avoid re-entering safe values.
- Avoid claiming this is a full UI redesign or accessibility standard fix, although the `role="alert"` helps screen-reader feedback.

### Literature

Useful sources:

- Nielsen and Molich (1990): heuristic evaluation and usability inspection. Key angle: interface feedback and keeping users oriented are standard usability concerns.
- Bargas-Avila et al. (2007): web form error presentation. Key angle: error message design affects the effectiveness of form correction.

### Implementation

Implemented change:

- Routes now pass `activeForm` and `formData`.
- Signup failures preserve normalized username and email.
- Login failures preserve normalized email and keep the login panel active.
- Password fields are never repopulated.
- `role="alert"` added to the auth error message.
- Added `test/auth-view.test.js`.

Report evidence:

- Before: `render("signup.ejs", { error })`.
- After: `render("signup.ejs", { error, activeForm, formData })`.
- Test: signup error preserves non-sensitive input and does not render password value.
- Test: login error keeps login panel active and does not render password value.

## Current Verification

Command:

```bash
npm test
```

Current expected result:

- 17 tests passed.

## Possible Report Wording

Hardcoded Configuration summary:

The application had an environment-sensitive MongoDB fallback encoded directly in the database connection module. Although the app supported environment overrides, the built-in default used `localhost`, which was unreliable on the test Windows environment because the driver could attempt IPv6 loopback while MongoDB was reachable on IPv4. The fix made the default explicit and testable while preserving environment override behavior.

UX/UI Feedback summary:

The authentication form returned generic error rendering without preserving task context. Failed signup attempts cleared safe fields, and failed login attempts returned the user to the default signup state. The fix keeps the relevant form active and preserves only non-sensitive values, reducing repeated user effort while avoiding password exposure.
