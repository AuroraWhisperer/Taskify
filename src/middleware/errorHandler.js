const { logErrorEvent, logSecurityEvent } = require("../utilities/auditLogger");

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
        return res.status(403).send("Request could not be completed.");
    }

    if (wantsHtml(req) && (req.path === "/login" || req.path === "/signup")) {
        return res.status(statusCode).render("signup.ejs", {
            error: "The request could not be completed. Please try again later."
        });
    }

    return res.status(statusCode).send("Something went wrong. Please try again later.");
}

function notFoundHandler(req, res) {
    res.status(404).send("404 - Page Not Found");
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
