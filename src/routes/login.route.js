const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const createRateLimiter = require('../middleware/rateLimit');
const asyncHandler = require('../utilities/asyncHandler');
const { hashIdentifier, logSecurityEvent } = require('../utilities/auditLogger');
const { getPassword, normalizeEmail } = require('../utilities/validation');
const { regenerateSession } = require('../utilities/session');

const loginIpRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxAttempts: 15,
    messageKey: 'rateLimit.loginIp',
    renderLocals: { showLogin: true }
});

const loginAccountRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxAttempts: 10,
    messageKey: 'rateLimit.loginAccount',
    renderLocals: { showLogin: true },
    keyGenerator: (req) => {
        const email = normalizeEmail(req.body?.LoginEmail);
        return email ? `login-account:${hashIdentifier(email)}` : null;
    }
});

router.post('/login', loginIpRateLimiter, loginAccountRateLimiter, asyncHandler(async (req, res) => {
    const { LoginEmail, LoginPassword } = req.body;
    const email = normalizeEmail(LoginEmail);
    const password = getPassword(LoginPassword);
    const emailHash = hashIdentifier(email);

    if (!email || !password) {
        logSecurityEvent('login_failed', req, {
            reason: 'missing_credentials',
            emailHash
        });
        return res.status(400).render('signup', { error: req.t('login.missing_credentials'), showLogin: true });
    }

    const user = await User.findOne({ email });
    if (!user) {
        logSecurityEvent('login_failed', req, {
            reason: 'invalid_credentials',
            emailHash
        });
        return res.status(400).render('signup', { error: req.t('login.invalid_credentials'), showLogin: true });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        logSecurityEvent('login_failed', req, {
            reason: 'invalid_credentials',
            emailHash,
            userId: String(user._id)
        });
        return res.status(400).render('signup', { error: req.t('login.invalid_credentials'), showLogin: true });
    }

    await regenerateSession(req);
    req.session.userId = user._id;
    req.session.username = user.username;
    await loginIpRateLimiter.reset(req);
    await loginAccountRateLimiter.reset(req);
    logSecurityEvent('login_succeeded', req, {
        emailHash,
        userId: String(user._id)
    });
    res.redirect('/dashboard');
}));

module.exports = router;
