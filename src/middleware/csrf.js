const crypto = require("crypto");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function createToken() {
    return crypto.randomBytes(32).toString("hex");
}

function isValidToken(expected, actual) {
    if (typeof expected !== "string" || typeof actual !== "string") {
        return false;
    }

    if (!expected || !actual || expected.length !== actual.length) {
        return false;
    }

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

function csrfProtection(req, res, next) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = createToken();
    }

    res.locals.csrfToken = req.session.csrfToken;

    if (SAFE_METHODS.has(req.method)) {
        return next();
    }

    const submittedToken = req.body && req.body._csrf;

    if (!isValidToken(req.session.csrfToken, submittedToken)) {
        const err = new Error("Invalid CSRF token");
        err.statusCode = 403;
        err.code = "CSRF_TOKEN_INVALID";
        return next(err);
    }

    next();
}

module.exports = csrfProtection;
