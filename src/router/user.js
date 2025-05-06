module.exports = (middleware) => {
    const router = require("express").Router();

    router.get('/home', middleware, async (req, res) => {
        res.render('home', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/assets', middleware, (req, res) => {
        res.render('assets', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/plans', middleware, (req, res) => {
        res.render('plans', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/more', middleware, (req, res) => {
        res.render('more', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/profile', middleware, (req, res) => {
        res.render('profiles', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/settings', middleware, (req, res) => {
        res.render('settings', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/logout', middleware, (req, res) => {
        req.session.destroy();
        return res.redirect('/login');
    });

    return router;
};
