const { logSecurityEvent } = require("../utilities/auditLogger");

function createRateLimiter(options = {}) {
    const windowMs = options.windowMs || 15 * 60 * 1000;
    const maxAttempts = options.maxAttempts || 5;
    const message = options.message || "Too many requests. Please wait and try again.";
    const attempts = new Map();

    function getKey(req) {
        const ip = req.ip || req.socket?.remoteAddress || "unknown";
        const path = req.route?.path || req.path || req.originalUrl;
        return `${ip}:${req.method}:${path}`;
    }

    function cleanupExpired(currentTime) {
        for (const [key, record] of attempts.entries()) {
            if (record.resetAt <= currentTime) {
                attempts.delete(key);
            }
        }
    }

    function rateLimiter(req, res, next) {
        const currentTime = Date.now();
        cleanupExpired(currentTime);

        const key = getKey(req);
        let record = attempts.get(key);

        if (!record || record.resetAt <= currentTime) {
            record = {
                count: 0,
                resetAt: currentTime + windowMs
            };
        }

        const retryAfterSeconds = Math.ceil((record.resetAt - currentTime) / 1000);

        if (record.count >= maxAttempts) {
            res.set("Retry-After", String(retryAfterSeconds));
            logSecurityEvent("rate_limit_exceeded", req, {
                limit: maxAttempts,
                windowMs
            });
            return res.status(429).render("signup", { error: message });
        }

        record.count += 1;
        attempts.set(key, record);
        next();
    }

    rateLimiter.reset = function reset(req) {
        attempts.delete(getKey(req));
    };

    return rateLimiter;
}

module.exports = createRateLimiter;
