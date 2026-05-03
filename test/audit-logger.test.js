const test = require("node:test");
const assert = require("node:assert/strict");

const {
    hashIdentifier,
    logErrorEvent,
    logInfoEvent,
    logSecurityEvent
} = require("../src/utilities/auditLogger");

function captureConsole(method, run) {
    const original = console[method];
    const messages = [];
    console[method] = (line) => {
        messages.push(line);
    };

    try {
        run(messages);
    } finally {
        console[method] = original;
    }

    return messages;
}

test("audit identifier hashing is stable and privacy-preserving", () => {
    assert.equal(hashIdentifier(null), null);
    assert.equal(hashIdentifier(" Alice@Example.com "), hashIdentifier("alice@example.com"));
    assert.equal(hashIdentifier("alice@example.com").length, 16);
});

test("security logs include request context while redacting secrets", () => {
    const messages = captureConsole("warn", () => {
        logSecurityEvent("login_failed", {
            method: "POST",
            originalUrl: "/login",
            ip: "127.0.0.1",
            sessionID: "session-id",
            session: { userId: "user-1" }
        }, {
            password: "plain-text",
            csrfToken: "token",
            sessionHash: "allowed-session-hash",
            emailHash: "email-hash"
        });
    });

    const entry = JSON.parse(messages[0]);

    assert.equal(entry.level, "warn");
    assert.equal(entry.event, "login_failed");
    assert.equal(entry.path, "/login");
    assert.equal(entry.userId, "user-1");
    assert.equal(entry.password, "[redacted]");
    assert.equal(entry.csrfToken, "[redacted]");
    assert.equal(entry.sessionHash, "allowed-session-hash");
    assert.equal(entry.emailHash, "email-hash");
});

test("info and error logs use the expected streams and compact error details", () => {
    const infoMessages = captureConsole("log", () => {
        logInfoEvent("application_started", { port: 3000 });
    });
    const errorMessages = captureConsole("error", () => {
        const err = new Error("database unavailable");
        err.code = "ECONNREFUSED";
        logErrorEvent("database_connection_failed", err, {
            method: "GET",
            path: "/",
            socket: { remoteAddress: "127.0.0.1" },
            sessionID: "session-id",
            session: {}
        }, {
            token: "secret-token"
        });
    });

    const infoEntry = JSON.parse(infoMessages[0]);
    const errorEntry = JSON.parse(errorMessages[0]);

    assert.equal(infoEntry.level, "info");
    assert.equal(infoEntry.port, 3000);
    assert.equal(errorEntry.level, "error");
    assert.deepEqual(errorEntry.error, { name: "Error", code: "ECONNREFUSED" });
    assert.equal(errorEntry.token, "[redacted]");
});
