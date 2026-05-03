const test = require("node:test");
const assert = require("node:assert/strict");

const {
    LOCALE_COOKIE,
    getSafeRedirectPath,
    normalizeLocale,
    otherLocale,
    otherLocaleLabel,
    pickLocale,
    translate
} = require("../src/utilities/i18n");

test("locale normalization accepts supported variants and defaults safely", () => {
    assert.equal(normalizeLocale("zh-CN"), "zh");
    assert.equal(normalizeLocale("zh_CN"), "zh");
    assert.equal(normalizeLocale("en-US"), "en");
    assert.equal(normalizeLocale("fr"), "en");
    assert.equal(normalizeLocale(null), "en");
});

test("locale selection reads cookies and falls back to English", () => {
    assert.equal(pickLocale({ headers: { cookie: `${LOCALE_COOKIE}=zh-CN` } }), "zh");
    assert.equal(pickLocale({ headers: { cookie: `other=1; ${LOCALE_COOKIE}=bad` } }), "en");
    assert.equal(pickLocale({ headers: {} }), "en");
});

test("translation falls back from unsupported locales and missing keys", () => {
    assert.equal(translate("fr", "meta.loginTitle"), "Login");
    assert.equal(translate("en", "missing.translation.key"), "missing.translation.key");
});

test("redirect paths stay local and bounded", () => {
    assert.equal(getSafeRedirectPath("/dashboard"), "/dashboard");
    assert.equal(getSafeRedirectPath("//evil.example/path"), "/");
    assert.equal(getSafeRedirectPath("https://evil.example"), "/");
    assert.equal(getSafeRedirectPath(""), "/");
    assert.equal(getSafeRedirectPath(`/${"a".repeat(600)}`).length, 512);
});

test("locale switch helpers expose the opposite locale", () => {
    assert.equal(otherLocale("zh"), "en");
    assert.equal(otherLocale("en"), "zh");
    assert.equal(otherLocaleLabel("zh"), "English");
    assert.equal(otherLocaleLabel("en").length > 0, true);
});
