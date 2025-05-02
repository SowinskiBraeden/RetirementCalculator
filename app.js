const express = require('express');
const path = require('path');
const session = require("express-session");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views',path.join(__dirname, 'src/views'));
app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static("./src/public"));

app.use(session({
    secret: process.env.secret,
    resave: true,
    saveUninitialized: false,
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

/*
ROUTINGS
*/

app.get('/', (req, res) => {
    if (!req.session.errMessage) req.session.errMessage = "";
    res.render('index');
});

app.get('/landing', (req, res) => {
    res.render('landing');
});

app.get('/signup', (req, res) => {
    res.render('signup', { errMessage: req.session.errMessage });
});

app.get('/login', (req, res) => {
    res.render('login', { errMessage: req.session.errMessage });
});

app.get('/home', (req, res) => {
    res.render('home');
});

app.get('/assets', (req, res) => {
    res.render('assets');
});

app.get('/plans', (req, res) => {
    res.render('plans');
});

app.get('/more', (req, res) => {
    res.render('more');
});

app.get('/profile', (req, res) => {
    res.render('profiles');
});

app.get('/settings', (req, res) => {
    res.render('settings');
});

app.get('/aboutUs', (req, res) => {
    res.render('aboutUs');
});

app.get('/*splat', (req, res) => {
    res.status(404);
    res.send('404 Not Found');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
