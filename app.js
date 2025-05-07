const status = require("./src/util/statuses");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const express = require('express');
const path = require('path');
const joi = require('joi');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 3000;

const mongoURI = process.env.mongoURI || "mongodb://localhost:27017/";
const database = process.env.database || "knoldus"; // Database name
const secret = process.env.secret || "123-secret-xyz";

/*** Sessions ***/
app.use(session({
    secret: secret,
    store: MongoStore.create({ mongoUrl: `${mongoURI}${database}`, crypto: { secret: secret } }),
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 },
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static("./src/public"));
app.use("/images", express.static("./src/public/images"));
app.use(express.json());

/*** Database ***/
const { connectMongo, getCollection } = require("./src/database/connection");

let users;
async function initDatabase() {
    const db = await connectMongo(mongoURI, database);

    // For any collection, init here
    users = await getCollection(db, "users");
    plans = await getCollection(db, "plans");
}

/*** ROUTINGS ***/

app.get('/', (req, res) => {
    if (!req.session.errMessage) req.session.errMessage = "";
    res.render('dashboard');
    return res.status(status.Ok);
});

app.get('/signup', (req, res) => {
    const ignore = ["User not found", "Incorrect password"];
    if (ignore.includes(req.session.errMessage)) req.session.errMessage = "";
    res.render('signup', { errMessage: req.session.errMessage });
    return res.status(status.Ok);
});

app.get('/login', (req, res) => {
    if (req.session.authenticated) {
        res.redirect("/home");
        return res.status(status.Ok);
    }
    res.render('login', { errMessage: req.session.errMessage });
    return res.status(status.Ok);
});

app.get('/aboutUs', (req, res) => {
    res.render('aboutUs');
    return res.status(status.Ok);
});

app.get('/forgotPassword', (req, res) => {
    res.render('forgotPass');
    return res.status(status.Ok);
});

app.get('/reset/:token', async (req, res) => {
    const token = req.params.token;

    const user = await users.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
        req.session.error = 'reset link not valid or has expired';
        return res.redirect('/forgotPassword');
    }
    res.render('resetPassword', {
        token: token,
        errMessage: req.session.error || '',
    });
});

app.post('/api/location', async (req, res) => {
    const { latitude, longitude } = req.body;

    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=country&key=${process.env.geolocation_api}`);

    const data = await response.json();

    res.json(data);
});

// Initialize database and start app
initDatabase().then(() => {
    console.log("Successfully connected to MongoDB");

    // Import authentication handler
    app.use(require("./src/auth/authentication")(users));

    // Import middleware & apply to user routes
    const middleware = require("./src/auth/middleware")(users, plans);
    app.use(require('./src/router/user')(middleware, users, plans));
    app.use(require('./src/auth/forgetPass')(users));

    // 404 handler
    app.get('/*splat', (req, res) => {
        res.send('404 Not Found');
        return res.status(status.NotFound);
    });

    // Start app
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
});
