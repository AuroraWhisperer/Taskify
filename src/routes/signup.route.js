const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const createRateLimiter = require('../middleware/rateLimit');
const asyncHandler = require('../utilities/asyncHandler');
const { hashIdentifier, logSecurityEvent } = require('../utilities/auditLogger');
const { normalizeEmail, validateSignupInput } = require('../utilities/validation');
const { regenerateSession } = require('../utilities/session');

function isDuplicateEmailError(err) {
    if (!err || err.code !== 11000) {
        return false;
    }

    if (err.keyPattern && Object.prototype.hasOwnProperty.call(err.keyPattern, 'email')) {
        return true;
    }

    if (err.keyValue && typeof err.keyValue === 'object' && Object.prototype.hasOwnProperty.call(err.keyValue, 'email')) {
        return true;
    }

    const msg = String(err.message || '');
    return /\bdup key:\s*\{[^}]*\bemail\b/i.test(msg);
}

function renderDuplicateEmail(req, res, emailHash, detail) {
    logSecurityEvent('signup_rejected', req, {
        reason: 'duplicate_email',
        detail: detail || 'unknown',
        emailHash
    });

    return res.status(400).render('signup', {
        error: req.t('signup.duplicateEmail'),
        showLogin: false
    });
}

function createSignupIpRateLimiter() {
    return createRateLimiter({
        windowMs: 30 * 60 * 1000,
        maxAttempts: 10,
        messageKey: 'rateLimit.signupIp'
    });
}

function createSignupEmailRateLimiter() {
    return createRateLimiter({
        windowMs: 30 * 60 * 1000,
        maxAttempts: 5,
        messageKey: 'rateLimit.signupEmail',
        keyGenerator: (req) => {
            const email = normalizeEmail(req.body?.SignUpEmail);
            return email ? `signup-email:${hashIdentifier(email)}` : null;
        }
    });
}

function createSignupRouter(options = {}) {
    const router = express.Router();
    const UserModel = options.UserModel || User;
    const signupIpRateLimiter = options.signupIpRateLimiter || createSignupIpRateLimiter();
    const signupEmailRateLimiter = options.signupEmailRateLimiter || createSignupEmailRateLimiter();

    router.post('/signup', signupIpRateLimiter, signupEmailRateLimiter, asyncHandler(async (req, res) => {
        const { errorKey, values } = validateSignupInput(req.body);

        if (errorKey) {
            logSecurityEvent('signup_rejected', req, { reason: 'validation_failed' });
            return res.status(400).render('signup', { error: req.t(errorKey), showLogin: false });
        }

        const signupEmail = values && values.email;
        const signupUsername = values && values.username;
        const signupPassword = values && values.password;

        if (
            typeof signupEmail !== 'string' ||
            typeof signupUsername !== 'string' ||
            typeof signupPassword !== 'string' ||
            !signupEmail ||
            !signupUsername ||
            !signupPassword
        ) {
            logSecurityEvent('signup_rejected', req, { reason: 'malformed_validated_payload' });
            return res.status(400).render('signup', {
                error: req.t('validation.all_fields_required'),
                showLogin: false
            });
        }

        const emailHash = hashIdentifier(signupEmail);
        const existing = await UserModel.findOne({ email: signupEmail });
        if (existing) {
            return renderDuplicateEmail(req, res, emailHash, 'email_already_in_database');
        }

        const user = new UserModel({
            username: signupUsername,
            email: signupEmail,
            password: signupPassword
        });

        try {
            await user.save();
        } catch (err) {
            if (isDuplicateEmailError(err)) {
                return renderDuplicateEmail(req, res, emailHash, 'unique_index_on_save');
            }

            throw err;
        }

        await regenerateSession(req);
        req.session.userId = user._id;
        req.session.username = user.username;
        logSecurityEvent('signup_succeeded', req, {
            emailHash,
            userId: String(user._id)
        });
        res.redirect('/dashboard');
    }));

    return router;
}

module.exports = createSignupRouter();
module.exports.createSignupRouter = createSignupRouter;
module.exports.isDuplicateEmailError = isDuplicateEmailError;
