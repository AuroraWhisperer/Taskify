const crypto = require("crypto");

const REDACTED = "[redacted]";
const SENSITIVE_KEY_PATTERN = /(password|token|secret|cookie|csrf|authorization|session)/i;

function hashIdentifier(value) {
    if (!value) {
        return null;
    }

    return crypto
        .createHash("sha256")
        .update(String(value).trim().toLowerCase())
        .digest("hex")
        .slice(0, 16);
}

function sanitizeDetails(details = {}) {
    const sanitized = {};

    for (const [key, value] of Object.entries(details)) {
        if (value === undefined || value === null) {
            continue;
        }

        if (key !== "sessionHash" && SENSITIVE_KEY_PATTERN.test(key)) {
            sanitized[key] = REDACTED;
            continue;
        }

        sanitized[key] = value;
    }

    return sanitized;
}

function getRequestContext(req) {
    if (!req) {
        return {};
    }

    return {
        method: req.method,
        path: req.originalUrl || req.path,
        ip: req.ip || req.socket?.remoteAddress || "unknown",
        sessionHash: hashIdentifier(req.sessionID),
        userId: req.session?.userId ? String(req.session.userId) : undefined
    };
}

function writeLog(level, event, details = {}) {
    const entry = {
        time: new Date().toISOString(),
        level,
        event,
        ...sanitizeDetails(details)
    };

    const line = JSON.stringify(entry);

    if (level === "error") {
        console.error(line);
        return;
    }

    if (level === "warn") {
        console.warn(line);
        return;
    }

    console.log(line);
}

function logSecurityEvent(event, req, details = {}) {
    writeLog("warn", event, {
        ...getRequestContext(req),
        ...details
    });
}

function logInfoEvent(event, details = {}) {
    writeLog("info", event, details);
}

function logErrorEvent(event, err, req, details = {}) {
    const errorDetails = {
        name: err?.name || "Error",
        code: err?.code || err?.statusCode || err?.status
    };

    writeLog("error", event, {
        ...getRequestContext(req),
        ...details,
        error: errorDetails
    });
}

module.exports = {
    hashIdentifier,
    logErrorEvent,
    logInfoEvent,
    logSecurityEvent
};
