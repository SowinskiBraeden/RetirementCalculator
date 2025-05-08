const status = require("./src/util/statuses");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const express = require('express');
const path = require('path');
const joi = require('joi');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const mongoURI = process.env.mongoURI;
const database = process.env.database; // Database name
const secret   = process.env.secret   || "123-secret-xyz";

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
let assets;
let plans;
async function initDatabase() {
    const db = await connectMongo(mongoURI, database);

    // For any collection, init here
    users  = await getCollection(db, "users");
    assets = await getCollection(db, "assets");
    plans  = await getCollection(db, "plans");
}

/*** ROUTINGS ***/

app.get('/', (req, res) => {
    if (!req.session.errMessage) req.session.errMessage = "";
    res.render('landing');
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

// Initialize database and start app
initDatabase().then(() => {
    console.log("Successfully connected to MongoDB");

    // Import authentication handler
    app.use(require("./src/auth/authentication")(users));
    
    // Import middleware & apply to user routes
    const middleware = require("./src/auth/middleware")(users);
    app.use(require('./src/router/user')(middleware, users, plans, assets));

    // 404 handler
    app.get('/*splat', (req, res) => {
        res.render('notFound');
        return res.status(status.NotFound);
    });
    
    // Start app
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
});
