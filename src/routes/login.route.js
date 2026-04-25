const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user.model');

router.post('/login', async (req, res) => {
    const { LoginEmail, LoginPassword } = req.body;

    if (!LoginEmail || !LoginPassword) {
        return res.status(400).render('signup', { error: '请输入邮箱和密码' });
    }

    try {
        const user = await User.findOne({ email: LoginEmail });
        if (!user) {
            return res.status(400).render('signup', { error: '邮箱或密码错误' });
        }

        const isMatch = await bcrypt.compare(LoginPassword, user.password);
        if (!isMatch) {
            return res.status(400).render('signup', { error: '邮箱或密码错误' });
        }

        req.session.userId = user._id;
        req.session.username = user.username;
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.status(500).render('signup', { error: '登录失败，请稍后重试' });
    }
});

module.exports = router;
