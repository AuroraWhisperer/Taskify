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

    return Boolean(
        err.keyPattern?.email ||
        err.keyValue?.email ||
        /email/i.test(String(err.message || ''))
    );
}

function renderDuplicateEmail(req, res, emailHash) {
    logSecurityEvent('signup_rejected', req, {
        reason: 'duplicate_email',
        emailHash
    });

    return res.status(400).render('signup', {
        error: 'Signup could not be completed. Please check your details and try again.',
        showLogin: false
    });
}

function createSignupIpRateLimiter() {
    return createRateLimiter({
        windowMs: 30 * 60 * 1000,
        maxAttempts: 10,
        message: 'Too many signup attempts. Please wait 30 minutes and try again.'
    });
}

function createSignupEmailRateLimiter() {
    return createRateLimiter({
        windowMs: 30 * 60 * 1000,
        maxAttempts: 5,
        message: 'Too many signup attempts for this email. Please wait 30 minutes and try again.',
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
        const { error, values } = validateSignupInput(req.body);

        if (error) {
            logSecurityEvent('signup_rejected', req, { reason: 'validation_failed' });
            return res.status(400).render('signup', { error, showLogin: false });
        }

        const emailHash = hashIdentifier(values.email);
        const existing = await UserModel.findOne({ email: values.email });
        if (existing) {
            return renderDuplicateEmail(req, res, emailHash);
        }

        const user = new UserModel({
            username: values.username,
            email: values.email,
            password: values.password
        });

        try {
            await user.save();
        } catch (err) {
            if (isDuplicateEmailError(err)) {
                return renderDuplicateEmail(req, res, emailHash);
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
