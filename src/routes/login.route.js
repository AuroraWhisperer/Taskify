const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const createRateLimiter = require('../middleware/rateLimit');
const asyncHandler = require('../utilities/asyncHandler');
const { hashIdentifier, logSecurityEvent } = require('../utilities/auditLogger');
const { getPassword, normalizeEmail } = require('../utilities/validation');

const loginRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxAttempts: 15,
    message: 'Too many login attempts. Please wait 15 minutes and try again.'
});

router.post('/login', loginRateLimiter, asyncHandler(async (req, res) => {
    const { LoginEmail, LoginPassword } = req.body;
    const email = normalizeEmail(LoginEmail);
    const password = getPassword(LoginPassword);
    const emailHash = hashIdentifier(email);

    if (!email || !password) {
        logSecurityEvent('login_failed', req, {
            reason: 'missing_credentials',
            emailHash
        });
        return res.status(400).render('signup', { error: 'Please enter both email and password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
        logSecurityEvent('login_failed', req, {
            reason: 'invalid_credentials',
            emailHash
        });
        return res.status(400).render('signup', { error: 'Email or password is incorrect.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        logSecurityEvent('login_failed', req, {
            reason: 'invalid_credentials',
            emailHash,
            userId: String(user._id)
        });
        return res.status(400).render('signup', { error: 'Email or password is incorrect.' });
    }

    req.session.userId = user._id;
    req.session.username = user.username;
    loginRateLimiter.reset(req);
    logSecurityEvent('login_succeeded', req, {
        emailHash,
        userId: String(user._id)
    });
    res.redirect('/dashboard');
}));

module.exports = router;
