# Taskify Flaw Improvement Notes

Date: 2026-04-30

This document records two focused flaw improvements for Taskify. The selection avoids the account-security area already covered in `docs/security.md`, including CSRF protection, authentication/session hardening, rate limiting, validation, centralized error handling, and audit logging.

## Selected Flaw 1: Hardcoded Configuration

### Detection

The local MongoDB fallback was hardcoded as `mongodb://localhost:27017/taskify` in `src/db/conn.js`. On the local Windows environment used for testing, `localhost` attempted IPv6 `::1` first while MongoDB accepted the IPv4 loopback address. This made local startup appear to fail even though the MongoDB service was installed and running.

### Literature

Configuration errors are a known reliability risk in deployed software systems. Yin et al. studied 546 real-world misconfigurations and found that many failures are caused by mistakes in configuration parameter values. Xu et al. further argue that detecting configuration errors early reduces failure damage, especially before latent configuration faults reach production.

### Implementation

The local MongoDB default is now centralized as `DEFAULT_LOCAL_MONGODB_URI` and uses `mongodb://127.0.0.1:27017/taskify`. The existing `LOCAL_MONGODB_URI` environment override still takes precedence, so deployment-specific configuration remains externalized.

### Files Changed

- `src/db/conn.js`
- `test/db-config.test.js`

## Selected Flaw 2: UX/UI Feedback

### Detection

The authentication page gave weak feedback after failed form submissions:

- Signup validation errors cleared the username and email fields.
- Login errors rendered the shared signup/login page but did not keep the login panel active.
- Signup username and email are non-sensitive enough to preserve during correction, while login credentials should remain empty because the main authentication flow intentionally clears login fields for privacy.

This made common correction workflows slower without requiring a large UI redesign.

### Literature

Nielsen and Molich's heuristic evaluation work frames timely, useful feedback as a core usability concern. Bargas-Avila et al. studied web form error message presentation and highlight that error handling design affects how effectively users correct form mistakes.

### Implementation

After merging the main authentication and i18n flow, login state is handled through the existing `showLogin` view flag and `auth-form.js` privacy guard. This branch keeps that model and adds `formData` only for signup correction, so failed signup submissions preserve normalized username and email while translated labels and placeholders continue to come from `t(...)`. Login fields and all password fields remain empty.

### Files Changed

- `src/app.js`
- `src/routes/signup.route.js`
- `views/signup.ejs`
- `test/auth-view.test.js`

## Verification

Command:

```bash
npm test
```

Result:

- Full project test suite passed after merging the latest `main` authentication flow: 22 tests passed.
- Added coverage for the IPv4 MongoDB default.
- Added coverage for signup form feedback, login panel state, and credential non-repopulation.

## References

- Yin, Z., Ma, X., Zheng, J., Zhou, Y., Bairavasundaram, L. N., & Pasupathy, S. (2011). An empirical study on configuration errors in commercial and open source systems. SOSP 2011. https://doi.org/10.1145/2043556.2043572
- Xu, T., Jin, X., Huang, P., Zhou, Y., Lu, S., Jin, L., & Pasupathy, S. (2016). Early detection of configuration errors to reduce failure damage. OSDI 2016. https://www.microsoft.com/en-us/research/publication/early-detection-configuration-errors-reduce-failure-damage/
- Nielsen, J., & Molich, R. (1990). Heuristic evaluation of user interfaces. CHI 1990. https://doi.org/10.1145/97243.97281
- Bargas-Avila, J. A., Oberholzer, G., Schmutz, P., de Vito, M., & Opwis, K. (2007). Usable error message presentation in the World Wide Web: Do not show errors right away. Interacting with Computers, 19(3), 330-341. https://doi.org/10.1016/j.intcom.2007.01.003
