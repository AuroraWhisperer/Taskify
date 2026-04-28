const { urlencoded } = require("express");
const express = require("express");
const path = require("path");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const bcrypt = require("bcrypt");
require("dotenv").config();

const auth = require("./middleware/auth");
const signupRouter = require("./routes/signup.route");
const loginRouter = require("./routes/login.route");
const User = require("./models/user.model");
const csrfProtection = require("./middleware/csrf");
const asyncHandler = require("./utilities/asyncHandler");
const { logErrorEvent, logInfoEvent, logSecurityEvent } = require("./utilities/auditLogger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const securityHeaders = require("./middleware/securityHeaders");
const { configureDatabaseUri, connectDatabase } = require("./db/conn");
const { getPassword } = require("./utilities/validation");
const { getSessionCookieOptions, validateEnvironment } = require("./utilities/config");

const views_path = path.join(__dirname, "../views");
const static_path = path.join(__dirname, "../static");

function createSessionConfig(options = {}) {
    const config = {
        secret: options.sessionSecret || process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: getSessionCookieOptions(process.env)
    };

    if (options.sessionStore) {
        config.store = options.sessionStore;
    } else if (!options.useMemorySessionStore) {
        config.store = MongoStore.create({ mongoUrl: process.env.MONGODB_URI });
    }

    return config;
}

function renderDashboardError(req, res, statusCode, error) {
    return res.status(statusCode).render("dashboard/dashboard.ejs", {
        username: req.session.username,
        error
    });
}

function createApp(options = {}) {
    const app = express();

    if (process.env.NODE_ENV === "production") {
        app.set("trust proxy", 1);
    }

    app.use(securityHeaders);
    app.use("/static", express.static(static_path));
    app.use(express.json());
    app.use(urlencoded({ extended: false }));

    app.use(session(createSessionConfig(options)));
    app.use(csrfProtection);

    app.set("view engine", "ejs");
    app.set("views", views_path);

    app.get("/", (req, res) => {
        res.status(200).render("index.ejs", { username: req.session.username || null });
    });

    app.get("/signup", (req, res) => {
        res.status(200).render("signup.ejs", { error: null });
    });

    app.use(signupRouter);
    app.use(loginRouter);

    app.post("/logout", (req, res, next) => {
        const userId = req.session?.userId ? String(req.session.userId) : undefined;

        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }

            logSecurityEvent("logout_succeeded", req, { userId });
            return res.redirect("/signup");
        });
    });

    app.post("/delete-account", auth, asyncHandler(async (req, res, next) => {
        const userId = String(req.session.userId);
        const confirmationPassword = getPassword(req.body.deletePassword);
        logSecurityEvent("account_deletion_requested", req, { userId });

        if (!confirmationPassword) {
            logSecurityEvent("account_deletion_failed", req, {
                reason: "missing_password",
                userId
            });
            return renderDashboardError(req, res, 400, "Please enter your password to delete the account.");
        }

        let user;

        try {
            user = await User.findById(userId);
        } catch (err) {
            logSecurityEvent("account_deletion_failed", req, {
                reason: "database_error",
                userId
            });
            throw err;
        }

        if (!user) {
            logSecurityEvent("account_deletion_failed", req, {
                reason: "user_not_found",
                userId
            });

            return req.session.destroy((err) => {
                if (err) {
                    return next(err);
                }

                return res.redirect("/signup");
            });
        }

        const passwordMatches = await bcrypt.compare(confirmationPassword, user.password);

        if (!passwordMatches) {
            logSecurityEvent("account_deletion_failed", req, {
                reason: "invalid_password",
                userId
            });
            return renderDashboardError(req, res, 400, "Password confirmation failed. Account was not deleted.");
        }

        try {
            await user.deleteOne();
        } catch (err) {
            logSecurityEvent("account_deletion_failed", req, {
                reason: "database_error",
                userId
            });
            throw err;
        }

        req.session.destroy((err) => {
            if (err) {
                logSecurityEvent("account_deletion_failed", req, {
                    reason: "session_destroy_error",
                    userId
                });
                return next(err);
            }

            logSecurityEvent("account_deleted", req, { userId });
            return res.redirect("/");
        });
    }));

    app.get("/dashboard", auth, (req, res) => {
        res.status(200).render("dashboard/dashboard.ejs", {
            username: req.session.username,
            error: null
        });
    });

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

async function start() {
    await configureDatabaseUri();
    validateEnvironment(process.env);

    const app = createApp();
    const port = process.env.PORT || 3000;

    try {
        await connectDatabase();
    } catch (err) {
        logErrorEvent("database_connection_failed", err);
        throw err;
    }

    app.listen(port, () => {
        logInfoEvent("application_started", { port });
        console.log(`The application started successfully on port ${port}`);
        console.log(`Open the app at http://localhost:${port}`);
    });
}

if (require.main === module) {
    start().catch((err) => {
        logErrorEvent("application_start_failed", err);
        process.exit(1);
    });
}

module.exports = {
    createApp,
    start
};
