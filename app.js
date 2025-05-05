const express = require('express');
const path = require('path');
const session = require("express-session");
const MongoStore = require("connect-mongo");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views',path.join(__dirname, 'src/views'));
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static("./src/public"));

/*** Sessions ***/
app.use(session({
    secret: config.express_secret,
    store: MongoStore.create({ mongoUrl: `${mongoURI}/${config.mongo_database}`, crypto: { secret: config.mongo_secret } }),
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: 60000 },
}));

/*** Database ***/
const { connectMongo, getCollection } = require("./src/database/connection");

let users;
async function initDatabase() {
    const mongoURI = process.env.mongoURI || "mongodb://localhost:27017/";
    const database = process.env.database || "knoldus"; // Database name
    
    const db = await connectMongo(mongoURI, database);
    
    // For any collection, init here
    users = await getCollection(db, "users");
}

initDatabase().then(() => {
    require("./src/auth/authentication")(app, users);
});

/*** ROUTINGS ***/

app.get('/', (req, res) => {
    if (!req.session.errMessage) req.session.errMessage = "";
    res.render('index');
    return res.status(200);
});

app.get('/landing', (req, res) => {
    res.render('landing');
    return res.status(200);
});

app.get('/signup', (req, res) => {
    res.render('signup', { errMessage: req.session.errMessage });
    return res.status(200);
});

app.get('/login', (req, res) => {
    if (req.session.authenticated) {
        
    }
    res.render('login', { errMessage: req.session.errMessage });
    return res.status(200);
});

app.get('/home', (req, res) => {
    res.render('home');
    return res.status(200);
});

app.get('/assets', (req, res) => {
    res.render('assets');
    return res.status(200);
});

app.get('/plans', (req, res) => {
    res.render('plans');
    return res.status(200);
});

app.get('/more', (req, res) => {
    res.render('more');
    return res.status(200);
});

app.get('/profile', (req, res) => {
    res.render('profiles');
    return res.status(200);
});

app.get('/settings', (req, res) => {
    res.render('settings');
    return res.status(200);
});

app.get('/aboutUs', (req, res) => {
    res.render('aboutUs');
    return res.status(200);
});

app.get('/*splat', (req, res) => {
    res.send('404 Not Found');
    return res.status(404);
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
