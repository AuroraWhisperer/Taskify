const test = require("node:test");
const assert = require("node:assert/strict");

const {
    normalizeEmail,
    normalizeUsername,
    validateSignupInput
} = require("../src/utilities/validation");

test("signup validation accepts and normalizes valid input", () => {
    const result = validateSignupInput({
        SignUpUsername: "  Alice   Smith  ",
        SignUpEmail: "ALICE@example.COM ",
        SignUpPassword: "pass1234"
    });

    assert.equal(result.errorKey, null);
    assert.deepEqual(result.values, {
        username: "Alice Smith",
        email: "alice@example.com",
        password: "pass1234"
    });
});

test("signup validation rejects invalid username characters", () => {
    const result = validateSignupInput({
        SignUpUsername: "Alice<script>",
        SignUpEmail: "alice@example.com",
        SignUpPassword: "pass1234"
    });

    assert.equal(result.errorKey, "validation.username_pattern");
});

test("signup validation rejects invalid email", () => {
    const result = validateSignupInput({
        SignUpUsername: "Alice",
        SignUpEmail: "not-an-email",
        SignUpPassword: "pass1234"
    });

    assert.equal(result.errorKey, "validation.email_invalid");
});

test("signup validation rejects weak password", () => {
    const result = validateSignupInput({
        SignUpUsername: "Alice",
        SignUpEmail: "alice@example.com",
        SignUpPassword: "password"
    });

    assert.equal(result.errorKey, "validation.password_strength");
});

test("normalizers handle non-string values safely", () => {
    assert.equal(normalizeUsername(null), "");
    assert.equal(normalizeEmail(undefined), "");
});
