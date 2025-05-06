const status = require("../util/statuses");

module.exports = (middleware) => {
    const router = require("express").Router();
    
    router.use(middleware);

    router.get('/home', async (req, res) => {
        res.render('home', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/assets', (req, res) => {
        res.render('assets', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/plans', (req, res) => {
        res.render('plans', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/more', (req, res) => {
        res.render('more', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/profile', (req, res) => {
        res.render('profiles', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/settings', (req, res) => {
        res.render('settings', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/logout', (req, res) => {
        req.session.destroy();
        return res.redirect('/login');
    });

    return router;
};
