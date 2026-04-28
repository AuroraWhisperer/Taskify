const test = require("node:test");
const assert = require("node:assert/strict");

const {
    getSessionCookieOptions,
    getSessionSecretIssues,
    validateEnvironment
} = require("../src/utilities/config");

test("session cookie options are hardened", () => {
    const developmentCookie = getSessionCookieOptions({ NODE_ENV: "development" });
    const productionCookie = getSessionCookieOptions({ NODE_ENV: "production" });

    assert.equal(developmentCookie.httpOnly, true);
    assert.equal(developmentCookie.sameSite, "lax");
    assert.equal(developmentCookie.secure, false);
    assert.equal(productionCookie.secure, true);
});

test("environment validation rejects missing or default session secrets", () => {
    assert.deepEqual(getSessionSecretIssues(""), ["SESSION_SECRET is required."]);
    assert.ok(getSessionSecretIssues("taskify_session_secret").length > 0);
    assert.ok(getSessionSecretIssues("replace_with_a_long_random_secret_at_least_32_chars").length > 0);

    assert.throws(() => {
        validateEnvironment({
            SESSION_SECRET: "taskify_session_secret",
            MONGODB_URI: "mongodb://localhost:27017/taskify"
        });
    }, /SESSION_SECRET/);
});

test("environment validation accepts strong required values", () => {
    assert.doesNotThrow(() => {
        validateEnvironment({
            SESSION_SECRET: "K95pfuqrV5s4KiNYLqG6XzBY9SRYqXn8",
            MONGODB_URI: "mongodb://localhost:27017/taskify"
        });
    });
});
