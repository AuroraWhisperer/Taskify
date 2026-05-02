const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const express = require("express");
const session = require("express-session");

const csrfProtection = require("../src/middleware/csrf");
const { errorHandler } = require("../src/middleware/errorHandler");
const { createSignupRouter, isDuplicateEmailError } = require("../src/routes/signup.route");

function getSessionCookie(response) {
    const setCookie = response.headers.get("set-cookie");
    assert.ok(setCookie, "expected a session cookie");
    return setCookie.split(";")[0];
}

function extractCsrfToken(html) {
    const token = html.match(/name="_csrf" value="([^"]+)"/)?.[1];
    assert.ok(token, "expected csrf token in page");
    return token;
}

async function withServer(app, run) {
    const server = await new Promise((resolve) => {
        const createdServer = app.listen(0, "127.0.0.1", () => resolve(createdServer));
    });

    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    try {
        await run(baseUrl);
    } finally {
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    }
}

function passThrough(req, res, next) {
    next();
}

class DuplicateEmailUser {
    constructor(values) {
        this._id = "duplicate-user-id";
        this.username = values.username;
    }

    static async findOne() {
        return null;
    }

    async save() {
        const err = new Error("E11000 duplicate key error collection: taskify.users index: email_1");
        err.code = 11000;
        err.keyPattern = { email: 1 };
        throw err;
    }
}

function createDuplicateEmailTestApp() {
    const app = express();

    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "../views"));
    app.use(express.urlencoded({ extended: false }));
    app.use(session({
        secret: "test_session_secret_with_enough_length",
        resave: false,
        saveUninitialized: false
    }));
    app.use(csrfProtection);

    app.get("/signup", (req, res) => {
        res.status(200).render("signup", { error: null, showLogin: false });
    });

    app.use(createSignupRouter({
        UserModel: DuplicateEmailUser,
        signupIpRateLimiter: passThrough,
        signupEmailRateLimiter: passThrough
    }));
    app.use(errorHandler);

    return app;
}

test("duplicate email save race returns a signup form error", async () => {
    const originalWarn = console.warn;
    console.warn = () => {};

    try {
        await withServer(createDuplicateEmailTestApp(), async (baseUrl) => {
            const formResponse = await fetch(`${baseUrl}/signup`);
            const cookie = getSessionCookie(formResponse);
            const token = extractCsrfToken(await formResponse.text());

            const response = await fetch(`${baseUrl}/signup`, {
                method: "POST",
                headers: {
                    Cookie: cookie,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    _csrf: token,
                    SignUpUsername: "Alice Smith",
                    SignUpEmail: "alice@example.com",
                    SignUpPassword: "Password123"
                }),
                redirect: "manual"
            });
            const html = await response.text();

            assert.equal(response.status, 400);
            assert.match(html, /Signup could not be completed/);
            assert.doesNotMatch(html, /The request could not be completed/);
        });
    } finally {
        console.warn = originalWarn;
    }
});

test("duplicate email helper recognizes Mongo duplicate key email errors", () => {
    assert.equal(isDuplicateEmailError({
        code: 11000,
        keyPattern: { email: 1 }
    }), true);
    assert.equal(isDuplicateEmailError({
        code: 11000,
        keyPattern: { username: 1 }
    }), false);
    assert.equal(isDuplicateEmailError({ code: 121 }), false);
});
