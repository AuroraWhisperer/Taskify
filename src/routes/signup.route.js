const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const createRateLimiter = require('../middleware/rateLimit');
const asyncHandler = require('../utilities/asyncHandler');
const { hashIdentifier, logSecurityEvent } = require('../utilities/auditLogger');
const { validateSignupInput } = require('../utilities/validation');

const signupRateLimiter = createRateLimiter({
    windowMs: 30 * 60 * 1000,
    maxAttempts: 10,
    message: 'Too many signup attempts. Please wait 30 minutes and try again.'
});

router.post('/signup', signupRateLimiter, asyncHandler(async (req, res) => {
    const { error, values } = validateSignupInput(req.body);

    if (error) {
        logSecurityEvent('signup_rejected', req, { reason: 'validation_failed' });
        return res.status(400).render('signup', { error });
    }

    const emailHash = hashIdentifier(values.email);
    const existing = await User.findOne({ email: values.email });
    if (existing) {
        logSecurityEvent('signup_rejected', req, {
            reason: 'duplicate_email',
            emailHash
        });
        return res.status(400).render('signup', {
            error: 'Signup could not be completed. Please check your details and try again.'
        });
    }

    const user = new User({
        username: values.username,
        email: values.email,
        password: values.password
    });

    await user.save();
    req.session.userId = user._id;
    req.session.username = user.username;
    logSecurityEvent('signup_succeeded', req, {
        emailHash,
        userId: String(user._id)
    });
    res.redirect('/dashboard');
}));

module.exports = router;
