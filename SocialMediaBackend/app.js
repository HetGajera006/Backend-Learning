const cookieParser = require('cookie-parser');
const express = require('express');
const path = require('path');
const app = express();

const userModel = require("./models/user");
const postModel = require("./models/post");

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/create", async (req, res) => {
    try {
        let { name, username, email, age, password } = req.body;
        let finduser = await userModel.findOne({ email });

        if (finduser) {
            return res.status(500).send("User already registered");
        }

        let salt = await bcrypt.genSalt(10);
        let hashedPassword = await bcrypt.hash(password, salt);

        let user = await userModel.create({
            name,
            username,
            email,
            age,
            password: hashedPassword
        });

        let token = jwt.sign({ email: user.email, userid: user._id }, "secret");
        res.cookie("token", token);
        
        // Redirect to profile instead of just sending "Created" text
        res.redirect("/profile");
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email });

    if (!user) {
        return res.status(500).send("Something is wrong");
    }

    bcrypt.compare(password, user.password, (err, result) => {
        if (err) return res.status(500).send("Something went wrong");

        if (result) {
            let token = jwt.sign({ email: user.email, userid: user._id }, "secret");
            res.cookie("token", token);
            return res.redirect("/profile");
        } else {
            return res.status(401).send("Invalid password");
        }
    });
});

app.get("/profile", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate("post");
    res.render('profile', { user });
});

app.post("/post", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    let { content } = req.body;

    let post = await postModel.create({
        user: user._id,
        content: content
    });

    user.post.push(post._id);
    await user.save();
    res.redirect("/profile");
});

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

function isLoggedIn(req, res, next) {
    if (!req.cookies.token) {
        return res.redirect("/login")
    }

    try {
        let data = jwt.verify(req.cookies.token, "secret");
        req.user = data;
        next();
    } catch (err) {
        return res.send("Invalid token");
    }
}

app.listen(5000);