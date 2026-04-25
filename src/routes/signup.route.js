const express = require('express');
const router = express.Router();
const User = require('../models/user.model');

router.post('/signup', async (req, res) => {
    const { SignUpUsername, SignUpEmail, SignUpPassword } = req.body;

    if (!SignUpUsername || !SignUpEmail || !SignUpPassword) {
        return res.status(400).render('signup', { error: '所有字段均为必填项' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(SignUpEmail)) {
        return res.status(400).render('signup', { error: '请输入有效的邮箱地址' });
    }

    if (SignUpPassword.length < 6) {
        return res.status(400).render('signup', { error: '密码长度至少为 6 位' });
    }

    try {
        const existing = await User.findOne({ email: SignUpEmail });
        if (existing) {
            return res.status(400).render('signup', { error: '该邮箱已被注册' });
        }

        const user = new User({
            username: SignUpUsername,
            email: SignUpEmail,
            password: SignUpPassword
        });

        await user.save();
        req.session.userId = user._id;
        req.session.username = user.username;
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).render('signup', { error: '注册失败，请稍后重试' });
    }
});

module.exports = router;
