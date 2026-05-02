const { logErrorEvent, logSecurityEvent } = require("../utilities/auditLogger");
const { pickLocale, translate } = require("../utilities/i18n");

function t(req, key) {
    if (typeof req.t === "function") {
        return req.t(key);
    }

    return translate(pickLocale(req), key);
}

function wantsHtml(req) {
    if (typeof req.accepts !== "function") {
        return true;
    }

    return req.accepts(["html", "json", "text"]) === "html";
}

function getStatusCode(err) {
    const status = Number(err?.statusCode || err?.status);

    if (Number.isInteger(status) && status >= 400 && status < 600) {
        return status;
    }

    return 500;
}

function renderGenericResponse(req, res, statusCode) {
    if (statusCode === 403) {
        return res.status(403).send(t(req, "error.forbidden"));
    }

    if (wantsHtml(req) && (req.path === "/login" || req.path === "/signup")) {
        return res.status(statusCode).render("signup", {
            error: t(req, "error.auth_retry"),
            showLogin: req.path === "/login"
        });
    }

    return res.status(statusCode).send(t(req, "error.server"));
}

function notFoundHandler(req, res) {
    res.status(404).send(t(req, "error.not_found"));
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = getStatusCode(err);

    if (err?.code === "CSRF_TOKEN_INVALID") {
        logSecurityEvent("csrf_rejected", req, { reason: "invalid_token" });
    } else {
        logErrorEvent("route_error", err, req, { statusCode });
    }

    return renderGenericResponse(req, res, statusCode);
}

module.exports = {
    errorHandler,
    notFoundHandler
};
