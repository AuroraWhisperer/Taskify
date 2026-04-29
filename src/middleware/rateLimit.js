const { logSecurityEvent } = require("../utilities/auditLogger");
const RateLimit = require("../models/rateLimit.model");

class MemoryRateLimitStore {
    constructor() {
        this.attempts = new Map();
    }

    cleanupExpired(currentTime) {
        for (const [key, record] of this.attempts.entries()) {
            if (record.resetAt <= currentTime) {
                this.attempts.delete(key);
            }
        }
    }

    async increment(key, windowMs, currentTime) {
        this.cleanupExpired(currentTime);

        let record = this.attempts.get(key);

        if (!record || record.resetAt <= currentTime) {
            record = {
                count: 0,
                resetAt: currentTime + windowMs
            };
        }

        record.count += 1;
        this.attempts.set(key, record);

        return record;
    }

    async reset(key) {
        this.attempts.delete(key);
    }
}

class MongoRateLimitStore {
    constructor(model = RateLimit) {
        this.model = model;
    }

    async increment(key, windowMs, currentTime) {
        const now = new Date(currentTime);
        const newResetAt = new Date(currentTime + windowMs);

        const record = await this.model.findOneAndUpdate(
            { key },
            [
                {
                    $set: {
                        key,
                        count: {
                            $cond: [
                                { $gt: ["$resetAt", now] },
                                { $add: ["$count", 1] },
                                1
                            ]
                        },
                        resetAt: {
                            $cond: [
                                { $gt: ["$resetAt", now] },
                                "$resetAt",
                                newResetAt
                            ]
                        }
                    }
                }
            ],
            {
                new: true,
                upsert: true
            }
        ).lean();

        return {
            count: record.count,
            resetAt: new Date(record.resetAt).getTime()
        };
    }

    async reset(key) {
        await this.model.deleteOne({ key });
    }
}

function createRateLimiter(options = {}) {
    const windowMs = options.windowMs || 15 * 60 * 1000;
    const maxAttempts = options.maxAttempts || 5;
    const message = options.message || "Too many requests. Please wait and try again.";
    const store = options.store || new MongoRateLimitStore();
    const keyGenerator = options.keyGenerator || defaultKeyGenerator;

    function defaultKeyGenerator(req) {
        const ip = req.ip || req.socket?.remoteAddress || "unknown";
        const path = req.route?.path || req.path || req.originalUrl;
        return `${ip}:${req.method}:${path}`;
    }

    function getKey(req) {
        const generatedKey = keyGenerator(req);
        return generatedKey ? String(generatedKey) : defaultKeyGenerator(req);
    }

    async function rateLimiter(req, res, next) {
        const currentTime = Date.now();
        const key = getKey(req);

        try {
            const record = await store.increment(key, windowMs, currentTime);
            const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - currentTime) / 1000));

            if (record.count > maxAttempts) {
                res.set("Retry-After", String(retryAfterSeconds));
                logSecurityEvent("rate_limit_exceeded", req, {
                    limit: maxAttempts,
                    windowMs
                });
                return res.status(429).render("signup", { error: message });
            }

            return next();
        } catch (err) {
            return next(err);
        }
    }

    rateLimiter.reset = async function reset(req) {
        await store.reset(getKey(req));
    };

    return rateLimiter;
}

module.exports = createRateLimiter;
module.exports.MemoryRateLimitStore = MemoryRateLimitStore;
module.exports.MongoRateLimitStore = MongoRateLimitStore;
