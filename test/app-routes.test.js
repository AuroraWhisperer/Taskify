const test = require("node:test");
const assert = require("node:assert/strict");

const { createApp } = require("../src/app");

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

function createRouteTestApp() {
    return createApp({
        useMemorySessionStore: true,
        sessionSecret: "test_session_secret_with_enough_length"
    });
}

test("locale route stores a supported locale and rejects unsafe redirects", async () => {
    await withServer(createRouteTestApp(), async (baseUrl) => {
        const response = await fetch(`${baseUrl}/set-locale?lang=zh-CN&redirect=https://evil.example`, {
            redirect: "manual"
        });

        assert.equal(response.status, 302);
        assert.equal(response.headers.get("location"), "/");
        assert.match(response.headers.get("set-cookie"), /taskify_locale=zh/);
        assert.match(response.headers.get("set-cookie"), /SameSite=Lax/i);
    });
});

test("privacy and missing routes render user-facing pages", async () => {
    await withServer(createRouteTestApp(), async (baseUrl) => {
        const privacyResponse = await fetch(`${baseUrl}/privacy`);
        const privacyHtml = await privacyResponse.text();
        const missingResponse = await fetch(`${baseUrl}/missing-page`);
        const missingBody = await missingResponse.text();

        assert.equal(privacyResponse.status, 200);
        assert.match(privacyHtml, /Privacy Policy/);
        assert.equal(missingResponse.status, 404);
        assert.match(missingBody, /404 - Page Not Found/);
    });
});
