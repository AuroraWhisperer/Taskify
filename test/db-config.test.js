const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const {
    DEFAULT_LOCAL_MONGODB_URI,
    getLocalMongoUri
} = require("../src/db/conn");

test("local MongoDB default uses explicit IPv4 loopback", () => {
    assert.equal(DEFAULT_LOCAL_MONGODB_URI, "mongodb://127.0.0.1:27017/taskify");
    assert.equal(getLocalMongoUri({}), DEFAULT_LOCAL_MONGODB_URI);
});

test("local MongoDB URI can be overridden by environment", () => {
    assert.equal(
        getLocalMongoUri({ LOCAL_MONGODB_URI: "mongodb://db.example.test:27017/taskify" }),
        "mongodb://db.example.test:27017/taskify"
    );
});

async function withPatchedEnv(patch, run) {
    const keys = [
        "DB_SOURCE",
        "DATABASE_SOURCE",
        "LOCAL_MONGODB_URI",
        "CLOUD_MONGODB_URI",
        "MONGODB_URI",
        "MONGO_URI"
    ];
    const original = {};

    for (const key of keys) {
        original[key] = process.env[key];
    }

    for (const key of keys) {
        delete process.env[key];
    }

    Object.assign(process.env, patch);

    try {
        return await run();
    } finally {
        for (const key of keys) {
            delete process.env[key];
            if (original[key] !== undefined) {
                process.env[key] = original[key];
            }
        }
    }
}

function loadFreshConnectionModule() {
    const modulePath = require.resolve("../src/db/conn");
    delete require.cache[modulePath];
    return require("../src/db/conn");
}

async function captureLog(run) {
    const originalLog = console.log;
    const lines = [];
    console.log = (line) => {
        lines.push(line);
    };

    try {
        const result = await run();
        return { lines, result };
    } finally {
        console.log = originalLog;
    }
}

test("database configuration selects and caches local environment settings", async () => {
    await withPatchedEnv({
        DB_SOURCE: "1",
        LOCAL_MONGODB_URI: "mongodb://127.0.0.1:27017/taskify_test"
    }, async () => {
        const conn = loadFreshConnectionModule();
        const first = await captureLog(() => conn.configureDatabaseUri());

        process.env.LOCAL_MONGODB_URI = "mongodb://127.0.0.1:27017/changed";
        const second = await conn.configureDatabaseUri();

        assert.equal(first.result.choice, "local");
        assert.equal(first.result.uri, "mongodb://127.0.0.1:27017/taskify_test");
        assert.equal(process.env.MONGODB_URI, "mongodb://127.0.0.1:27017/taskify_test");
        assert.equal(process.env.MONGO_URI, "mongodb://127.0.0.1:27017/taskify_test");
        assert.deepEqual(second, first.result);
        assert.match(first.lines[0], /Using local MongoDB/);
    });
});

test("database configuration selects cloud settings from the alias environment variable", async () => {
    await withPatchedEnv({
        DATABASE_SOURCE: "atlas",
        CLOUD_MONGODB_URI: "mongodb+srv://example.invalid/taskify"
    }, async () => {
        const conn = loadFreshConnectionModule();
        const { result } = await captureLog(() => conn.configureDatabaseUri());

        assert.equal(result.choice, "cloud");
        assert.equal(result.label, "MongoDB Atlas");
        assert.equal(result.uri, "mongodb+srv://example.invalid/taskify");
    });
});

test("database configuration falls back in non-interactive shells and rejects missing URIs", async () => {
    await withPatchedEnv({
        LOCAL_MONGODB_URI: "mongodb://127.0.0.1:27017/taskify_test"
    }, async () => {
        const conn = loadFreshConnectionModule();
        const { result } = await captureLog(() => conn.configureDatabaseUri());

        assert.equal(result.choice, "local");
    });

    await withPatchedEnv({
        DB_SOURCE: "cloud"
    }, async () => {
        const conn = loadFreshConnectionModule();
        await assert.rejects(() => conn.configureDatabaseUri(), /Missing cloud database URI/);
    });
});

test("connectDatabase delegates the selected URI to mongoose", async () => {
    const originalConnect = mongoose.connect;
    let receivedUri = null;
    mongoose.connect = async (uri) => {
        receivedUri = uri;
    };

    try {
        await withPatchedEnv({
            DB_SOURCE: "local",
            LOCAL_MONGODB_URI: "mongodb://127.0.0.1:27017/taskify_test"
        }, async () => {
            const conn = loadFreshConnectionModule();

            await captureLog(() => conn.connectDatabase());

            assert.equal(receivedUri, "mongodb://127.0.0.1:27017/taskify_test");
        });
    } finally {
        mongoose.connect = originalConnect;
    }
});
