const LOCALE_COOKIE = "taskify_locale";
const DEFAULT_LOCALE = "en";
const SUPPORTED = new Set(["en", "zh"]);

const en = require("../locales/en.json");
const zh = require("../locales/zh.json");

const bundles = { en, zh };

function normalizeLocale(value) {
    if (value === "zh" || value === "zh-CN" || value === "zh_CN") {
        return "zh";
    }

    if (value === "en" || value === "en-US") {
        return "en";
    }

    return DEFAULT_LOCALE;
}

function readCookie(req, name) {
    const raw = req.headers.cookie;
    if (!raw || typeof raw !== "string") {
        return null;
    }

    const segments = raw.split(";");
    for (const segment of segments) {
        const idx = segment.indexOf("=");
        if (idx === -1) {
            continue;
        }

        const key = segment.slice(0, idx).trim();
        if (key !== name) {
            continue;
        }

        let value = segment.slice(idx + 1).trim();
        try {
            value = decodeURIComponent(value);
        } catch {
            /* keep raw */
        }

        return value || null;
    }

    return null;
}

function pickLocale(req) {
    const fromCookie = normalizeLocale(readCookie(req, LOCALE_COOKIE));
    if (fromCookie && SUPPORTED.has(fromCookie)) {
        return fromCookie;
    }

    return DEFAULT_LOCALE;
}

function translate(locale, key) {
    const lang = SUPPORTED.has(locale) ? locale : DEFAULT_LOCALE;
    const table = bundles[lang] || bundles[DEFAULT_LOCALE];
    const fallback = bundles[DEFAULT_LOCALE];
    if (Object.prototype.hasOwnProperty.call(table, key)) {
        return table[key];
    }

    if (Object.prototype.hasOwnProperty.call(fallback, key)) {
        return fallback[key];
    }

    return key;
}

function getSafeRedirectPath(raw) {
    if (typeof raw !== "string" || raw.length === 0) {
        return "/";
    }

    if (!raw.startsWith("/") || raw.startsWith("//")) {
        return "/";
    }

    return raw.slice(0, 512);
}

function otherLocale(locale) {
    return locale === "zh" ? "en" : "zh";
}

function otherLocaleLabel(locale) {
    return locale === "zh" ? "English" : "中文";
}

module.exports = {
    LOCALE_COOKIE,
    DEFAULT_LOCALE,
    SUPPORTED,
    bundles,
    normalizeLocale,
    pickLocale,
    translate,
    getSafeRedirectPath,
    otherLocale,
    otherLocaleLabel
};
