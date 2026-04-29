const DEFAULT_SESSION_SECRETS = new Set([
    "taskify_session_secret",
    "replace_with_a_long_random_secret",
    "replace_with_a_long_random_secret_at_least_32_chars",
    "change_me",
    "changeme",
    "secret",
    "password"
]);

function getSessionSecretIssues(secret) {
    const value = typeof secret === "string" ? secret.trim() : "";
    const issues = [];

    if (!value) {
        issues.push("SESSION_SECRET is required.");
        return issues;
    }

    if (DEFAULT_SESSION_SECRETS.has(value.toLowerCase())) {
        issues.push("SESSION_SECRET must not use a default or example value.");
    }

    if (value.length < 32) {
        issues.push("SESSION_SECRET must be at least 32 characters long.");
    }

    if (/^(.)\1+$/.test(value) || new Set(value).size < 8) {
        issues.push("SESSION_SECRET must contain enough character variety.");
    }

    return issues;
}

function validateEnvironment(env = process.env) {
    const errors = [];

    errors.push(...getSessionSecretIssues(env.SESSION_SECRET));

    if (!env.MONGODB_URI) {
        errors.push("MONGODB_URI must be configured before starting the server.");
    }

    if (errors.length > 0) {
        const err = new Error(`Invalid environment configuration:\n- ${errors.join("\n- ")}`);
        err.code = "CONFIG_VALIDATION_FAILED";
        throw err;
    }
}

function getSessionCookieOptions(env = process.env) {
    return {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24
    };
}

module.exports = {
    getSessionCookieOptions,
    getSessionSecretIssues,
    validateEnvironment
};
