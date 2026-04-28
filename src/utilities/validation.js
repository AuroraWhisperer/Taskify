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
        return { error: "All fields are required." };
    }

    if (username.length < 3 || username.length > 30) {
        return { error: "Username must be between 3 and 30 characters." };
    }

    if (!USERNAME_PATTERN.test(username)) {
        return { error: "Username can only contain letters, numbers, spaces, underscores, and hyphens." };
    }

    if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
        return { error: "Please enter a valid email address." };
    }

    if (/[\u0000-\u001F\u007F]/.test(password)) {
        return { error: "Password contains unsupported characters." };
    }

    if (password.length < 8) {
        return { error: "Password must be at least 8 characters long." };
    }

    if (Buffer.byteLength(password, "utf8") > 72) {
        return { error: "Password must be 72 bytes or fewer." };
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return { error: "Password must include at least one letter and one number." };
    }

    return {
        error: null,
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
