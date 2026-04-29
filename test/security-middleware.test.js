const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const express = require("express");
const session = require("express-session");

const csrfProtection = require("../src/middleware/csrf");
const { errorHandler } = require("../src/middleware/errorHandler");
const createRateLimiter = require("../src/middleware/rateLimit");
const { MemoryRateLimitStore } = createRateLimiter;

function getSessionCookie(response) {
    const setCookie = response.headers.get("set-cookie");
    assert.ok(setCookie, "expected a session cookie");
    return setCookie.split(";")[0];
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

function createCsrfTestApp() {
    const app = express();

    app.use(express.urlencoded({ extended: false }));
    app.use(session({
        secret: "test_session_secret_with_enough_length",
        resave: false,
        saveUninitialized: false
    }));
    app.use(csrfProtection);

    app.get("/form", (req, res) => {
        res.type("html").send(`<input type="hidden" name="_csrf" value="${res.locals.csrfToken}" />`);
    });

    app.post("/submit", (req, res) => {
        res.status(204).end();
    });

    app.use((err, req, res, next) => {
        res.status(err.statusCode || 500).send(err.code || "error");
    });

    return app;
}

test("csrf middleware rejects unsafe requests without a token", async () => {
    await withServer(createCsrfTestApp(), async (baseUrl) => {
        const formResponse = await fetch(`${baseUrl}/form`);
        const cookie = getSessionCookie(formResponse);
        await formResponse.text();

        const response = await fetch(`${baseUrl}/submit`, {
            method: "POST",
            headers: {
                Cookie: cookie,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "name=value",
            redirect: "manual"
        });

        assert.equal(response.status, 403);
        await response.text();
    });
});

test("csrf middleware accepts unsafe requests with a valid token", async () => {
    await withServer(createCsrfTestApp(), async (baseUrl) => {
        const formResponse = await fetch(`${baseUrl}/form`);
        const cookie = getSessionCookie(formResponse);
        const html = await formResponse.text();
        const token = html.match(/name="_csrf" value="([^"]+)"/)?.[1];

        assert.ok(token, "expected csrf token in form");

        const response = await fetch(`${baseUrl}/submit`, {
            method: "POST",
            headers: {
                Cookie: cookie,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `_csrf=${encodeURIComponent(token)}`,
            redirect: "manual"
        });

        assert.equal(response.status, 204);
    });
});

test("rate limiter returns 429 after repeated attempts", async () => {
    const app = express();
    const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        maxAttempts: 2,
        message: "Limited",
        store: new MemoryRateLimitStore()
    });

    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "../views"));
    app.use((req, res, next) => {
        res.locals.csrfToken = "test_csrf_token";
        next();
    });
    app.post("/login", limiter, (req, res) => {
        res.status(400).send("invalid");
    });

    const originalWarn = console.warn;
    console.warn = () => {};

    try {
        await withServer(app, async (baseUrl) => {
            const first = await fetch(`${baseUrl}/login`, { method: "POST" });
            const second = await fetch(`${baseUrl}/login`, { method: "POST" });
            const third = await fetch(`${baseUrl}/login`, { method: "POST" });

            assert.equal(first.status, 400);
            assert.equal(second.status, 400);
            assert.equal(third.status, 429);
            assert.ok(third.headers.get("retry-after"));
            await first.text();
            await second.text();
            await third.text();
        });
    } finally {
        console.warn = originalWarn;
    }
});

test("signup error responses render the signup page", async () => {
    const app = express();

    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "../views"));
    app.use((req, res, next) => {
        res.locals.csrfToken = "test_csrf_token";
        next();
    });
    app.get("/signup", (req, res, next) => {
        const err = new Error("test failure");
        err.status = 500;
        next(err);
    });
    app.use(errorHandler);

    await withServer(app, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/signup`, {
            headers: { Accept: "text/html" }
        });
        const html = await response.text();

        assert.equal(response.status, 500);
        assert.match(html, /The request could not be completed/);
        assert.match(html, /Sign up/);
    });
});

test("rate limiter can use account-specific keys", async () => {
    const app = express();
    const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        maxAttempts: 1,
        message: "Limited",
        store: new MemoryRateLimitStore(),
        keyGenerator: (req) => `account:${req.body.email}`
    });

    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "../views"));
    app.use(express.urlencoded({ extended: false }));
    app.use((req, res, next) => {
        res.locals.csrfToken = "test_csrf_token";
        next();
    });
    app.post("/login", limiter, (req, res) => {
        res.status(400).send("invalid");
    });

    const originalWarn = console.warn;
    console.warn = () => {};

    try {
        await withServer(app, async (baseUrl) => {
            const headers = { "Content-Type": "application/x-www-form-urlencoded" };
            const first = await fetch(`${baseUrl}/login`, {
                method: "POST",
                headers,
                body: "email=alice%40example.com"
            });
            const second = await fetch(`${baseUrl}/login`, {
                method: "POST",
                headers,
                body: "email=alice%40example.com"
            });
            const third = await fetch(`${baseUrl}/login`, {
                method: "POST",
                headers,
                body: "email=bob%40example.com"
            });

            assert.equal(first.status, 400);
            assert.equal(second.status, 429);
            assert.equal(third.status, 400);
            await first.text();
            await second.text();
            await third.text();
        });
    } finally {
        console.warn = originalWarn;
    }
});
