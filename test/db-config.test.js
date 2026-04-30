const test = require("node:test");
const assert = require("node:assert/strict");

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
