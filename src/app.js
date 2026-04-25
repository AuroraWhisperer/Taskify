const { urlencoded } = require("express");
const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
require("dotenv").config();
require("./db/conn");

const auth = require("./middleware/auth");
const signupRouter = require("./routes/signup.route");
const loginRouter = require("./routes/login.route");
const User = require("./models/user.model");

const views_path = path.join(__dirname, "../views");
const static_path = path.join(__dirname, "../static");
const app = express();
const port = process.env.PORT || 3000;

app.use("/static", express.static(static_path));
app.use(express.json());
app.use(urlencoded({ extended: false }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }  // 24 小时
}));

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

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/signup");
    });
});

app.post("/delete-account", auth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.session.userId);
        req.session.destroy(() => {
            res.redirect("/");
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("注销账户失败，请稍后重试");
    }
});

app.get("/dashboard", auth, (req, res) => {
    res.status(200).render("dashboard/dashboard.ejs", { username: req.session.username });
});

app.use((req, res) => {
    res.status(404).send("404 - Page Not Found");
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong");
});

app.listen(port, () => {
    console.log(`The application started successfully on port ${port}`);
});
