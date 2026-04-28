const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const {
    EMAIL_PATTERN,
    USERNAME_PATTERN,
    normalizeEmail,
    normalizeUsername
} = require('../utilities/validation');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
        match: USERNAME_PATTERN,
        set: normalizeUsername
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 254,
        match: EMAIL_PATTERN,
        set: normalizeEmail
    },
    password: { type: String, required: true }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

module.exports = mongoose.model('User', userSchema);
