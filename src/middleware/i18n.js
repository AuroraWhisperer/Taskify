const { pickLocale, translate, otherLocale, otherLocaleLabel, getSafeRedirectPath } = require("../utilities/i18n");

function i18nMiddleware(req, res, next) {
    const locale = pickLocale(req);

    req.locale = locale;
    res.locals.locale = locale;
    res.locals.htmlLang = locale === "zh" ? "zh-CN" : "en";
    res.locals.t = (key) => translate(locale, key);
    req.t = res.locals.t;
    res.locals.localeOther = otherLocale(locale);
    res.locals.localeOtherLabel = otherLocaleLabel(locale);
    res.locals.localeSwitchHref = (lang) => {
        const redirect = encodeURIComponent(getSafeRedirectPath(req.path));
        return `/set-locale?lang=${encodeURIComponent(lang)}&redirect=${redirect}`;
    };

    next();
}

module.exports = i18nMiddleware;
