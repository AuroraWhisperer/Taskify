const test = require("node:test");
const assert = require("node:assert/strict");

const { errorHandler, notFoundHandler } = require("../src/middleware/errorHandler");

function createRequest(overrides = {}) {
    return {
        method: "GET",
        originalUrl: overrides.path || "/route",
        path: overrides.path || "/route",
        ip: "127.0.0.1",
        headers: {},
        sessionID: "session-id",
        session: {},
        accepts: () => overrides.accepts || "html",
        t: (key) => `translated:${key}`,
        ...overrides
    };
}

function createResponse() {
    return {
        headersSent: false,
        statusCode: null,
        body: null,
        view: null,
        locals: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        send(body) {
            this.body = body;
            return this;
        },
        render(view, locals) {
            this.view = view;
            this.locals = locals;
            return this;
        }
    };
}

test("not found handler returns a localized 404 response", () => {
    const res = createResponse();

    notFoundHandler(createRequest({ path: "/nope" }), res);

    assert.equal(res.statusCode, 404);
    assert.equal(res.body, "translated:error.not_found");
});

test("csrf errors return a forbidden response and log a security event", () => {
    const originalWarn = console.warn;
    console.warn = () => {};

    try {
        const err = new Error("bad csrf");
        err.code = "CSRF_TOKEN_INVALID";
        err.statusCode = 403;
        const res = createResponse();

        errorHandler(err, createRequest({ path: "/signup" }), res, () => {
            assert.fail("next should not be called");
        });

        assert.equal(res.statusCode, 403);
        assert.equal(res.body, "translated:error.forbidden");
    } finally {
        console.warn = originalWarn;
    }
});

test("auth page errors render the retry form state", () => {
    const originalError = console.error;
    console.error = () => {};

    try {
        const err = new Error("database unavailable");
        err.statusCode = 503;
        const res = createResponse();

        errorHandler(err, createRequest({ path: "/login" }), res, () => {
            assert.fail("next should not be called");
        });

        assert.equal(res.statusCode, 503);
        assert.equal(res.view, "signup");
        assert.deepEqual(res.locals, {
            error: "translated:error.auth_retry",
            showLogin: true
        });
    } finally {
        console.error = originalError;
    }
});

test("non-html server errors send a generic body", () => {
    const originalError = console.error;
    console.error = () => {};

    try {
        const res = createResponse();

        errorHandler(new Error("boom"), createRequest({ accepts: "json" }), res, () => {
            assert.fail("next should not be called");
        });

        assert.equal(res.statusCode, 500);
        assert.equal(res.body, "translated:error.server");
    } finally {
        console.error = originalError;
    }
});

test("headers-sent errors are delegated to the next handler", () => {
    const res = createResponse();
    const err = new Error("late failure");
    let delegated = null;
    res.headersSent = true;

    errorHandler(err, createRequest(), res, (received) => {
        delegated = received;
    });

    assert.equal(delegated, err);
});
