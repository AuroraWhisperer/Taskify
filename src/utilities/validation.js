const USERNAME_PATTERN = /^[A-Za-z0-9 _-]+$/;
const EMAIL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

function normalizeUsername(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .trim()
        .replace(/\s+/g, " ");
}

function normalizeEmail(value) {
    if (typeof value !== "string") {
        return "";
    }

    return value.trim().toLowerCase();
}

function getPassword(value) {
    return typeof value === "string" ? value : "";
}

function validateSignupInput(body = {}) {
    const username = normalizeUsername(body.SignUpUsername);
    const email = normalizeEmail(body.SignUpEmail);
    const password = getPassword(body.SignUpPassword);

    if (!username || !email || !password) {
        return { errorKey: "validation.all_fields_required" };
    }

    if (username.length < 3 || username.length > 30) {
        return { errorKey: "validation.username_length" };
    }

    if (!USERNAME_PATTERN.test(username)) {
        return { errorKey: "validation.username_pattern" };
    }

    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
        return { errorKey: "validation.email_invalid" };
    }

    if (/[\u0000-\u001F\u007F]/.test(password)) {
        return { errorKey: "validation.password_bad_chars" };
    }

    if (password.length < 8) {
        return { errorKey: "validation.password_short" };
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
        return { errorKey: "validation.password_bytes" };
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return { errorKey: "validation.password_strength" };
    }

    return {
        errorKey: null,
        values: {
            username,
            email,
            password
        }
    };
}

module.exports = {
    EMAIL_PATTERN,
    USERNAME_PATTERN,
    getPassword,
    normalizeEmail,
    normalizeUsername,
    validateSignupInput
};
