const auth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/signup');
};

module.exports = auth;
