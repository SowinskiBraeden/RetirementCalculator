const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views',path.join(__dirname, 'src/views'));


app.use(express.urlencoded({ extended: true }));


/*
STATIC ROUTINGS
*/

app.use("/scripts", express.static("./src/scripts"));
app.use("/css", express.static("./src/css"));
app.use("/images", express.static("./src/images"));
app.use("/views", express.static("./src/views"));


/*
ROUTINGS
*/

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/landing', (req, res) => {
    res.render('landing');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
    res.render('login');
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


app.post('/signup', (req, res) => {
    res.status(200);
    res.send('200 status code');
});

app.post('/login', (req, res) => {
    res.status(200);
    res.send('200 status code');
});

app.get('/*splat', (req, res) => {
    res.status(404);
    res.send('404 Not Found');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});