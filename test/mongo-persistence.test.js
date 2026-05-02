const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const { createApp } = require("../src/app");
const User = require("../src/models/user.model");

const TEST_DB_NAME = process.env.TEST_MONGODB_DB ||
    `taskify_integration_${process.pid}_${Date.now()}`;
const DEFAULT_TEST_URI = "mongodb://127.0.0.1:27017";

function getMongoUri() {
    return process.env.TEST_MONGODB_URI || DEFAULT_TEST_URI;
}

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

async function connectTestDatabase(t) {
    try {
        await mongoose.connect(getMongoUri(), {
            dbName: TEST_DB_NAME,
            serverSelectionTimeoutMS: 1500
        });
    } catch (err) {
        if (!process.env.TEST_MONGODB_URI) {
            t.skip("MongoDB is not available on 127.0.0.1:27017; set TEST_MONGODB_URI to run this integration test.");
            return false;
        }

        throw err;
    }

    const dbName = mongoose.connection.db.databaseName;
    if (!/^taskify_integration_/i.test(dbName) && !/test/i.test(dbName)) {
        throw new Error(`Refusing to drop non-test database "${dbName}". Use TEST_MONGODB_DB with a test database name.`);
    }

    await mongoose.connection.dropDatabase();
    await User.init();
    return true;
}

function createPersistenceTestApp() {
    return createApp({
        useMemorySessionStore: true,
        sessionSecret: "test_session_secret_with_enough_length"
    });
}

async function signup(baseUrl) {
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
            SignUpUsername: "Persistent User",
            SignUpEmail: "persistent@example.com",
            SignUpPassword: "Password123"
        }),
        redirect: "manual"
    });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/dashboard");
    await response.text();
}

async function loginWithFreshSession(baseUrl) {
    const formResponse = await fetch(`${baseUrl}/login`);
    const cookie = getSessionCookie(formResponse);
    const token = extractCsrfToken(await formResponse.text());

    const response = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: {
            Cookie: cookie,
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            _csrf: token,
            LoginEmail: "persistent@example.com",
            LoginPassword: "Password123"
        }),
        redirect: "manual"
    });

    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/dashboard");
    return getSessionCookie(response);
}

test("registered users persist in MongoDB and can log in after a new app session", async (t) => {
    const connected = await connectTestDatabase(t);
    if (!connected) {
        return;
    }

    try {
        await withServer(createPersistenceTestApp(), async (baseUrl) => {
            await signup(baseUrl);
        });

        const savedUser = await User.findOne({ email: "persistent@example.com" }).lean();
        assert.ok(savedUser, "expected signup to save the user in MongoDB");
        assert.equal(savedUser.username, "Persistent User");
        assert.notEqual(savedUser.password, "Password123");

        await withServer(createPersistenceTestApp(), async (baseUrl) => {
            const loginCookie = await loginWithFreshSession(baseUrl);
            const dashboardResponse = await fetch(`${baseUrl}/dashboard`, {
                headers: { Cookie: loginCookie },
                redirect: "manual"
            });
            const dashboardHtml = await dashboardResponse.text();

            assert.equal(dashboardResponse.status, 200);
            assert.match(dashboardHtml, /Persistent User/);
        });
    } finally {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    }
});
