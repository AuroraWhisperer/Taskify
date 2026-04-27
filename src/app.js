const { urlencoded } = require("express");
const express = require("express");
const path = require("path");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
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

const views_path = path.join(__dirname, "../views");
const static_path = path.join(__dirname, "../static");
const app = express();
const port = process.env.PORT || 3000;

async function start() {
    await configureDatabaseUri();

    app.use(securityHeaders);
    app.use("/static", express.static(static_path));
    app.use(express.json());
    app.use(urlencoded({ extended: false }));

    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
        cookie: { maxAge: 1000 * 60 * 60 * 24 }
    }));
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
        logSecurityEvent("account_deletion_requested", req, { userId });

        try {
            await User.findByIdAndDelete(userId);
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
        res.status(200).render("dashboard/dashboard.ejs", { username: req.session.username });
    });

    app.use(notFoundHandler);
    app.use(errorHandler);

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

start().catch((err) => {
    logErrorEvent("application_start_failed", err);
    process.exit(1);
});
