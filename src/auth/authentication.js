const joi = require("joi");
const bcrypt = require('bcrypt');
const salt = 12;

module.exports = (app, users) => {
    app.post("/login", async (req, res) => {
        const credentialSchema = joi.object({
            email: joi.string().email().required(),
            password: joi.string().max(20).required(),
        });

        const valid = credentialSchema.validate(req.body);

        if (valid.err) {
            req.session.errMessage = "Invalid input";
            res.status(400);
            return res.redirect("/login");
        }

        users.findOne({ "email": req.body.email }).then((user) => {
            if (!user) {
                req.session.errMessage = "User not found";
                res.status(404);
                return res.redirect("/login");                
            }

            if (!bcrypt.compare(req.body.password, user.password)) {
                req.session.errMessage = "Incorrect password";
                res.status(401);
                return res.redirect("/login");
            }

            // ignorin sessions for now just have basic login for demo
            // TODO: actually add sessions

            req.session.errMessage = "";
            res.redirect("/home");
        });
    });

    app.post("/signup", async (req, res) => {
        const userSchema = joi.object({
            email: joi.string().email().required(),
            // name: joi.string().alphanum().max(20).required(),
            password: joi.string().max(20).min(8).required(),
            repassword: joi.string().max(20).min(8).required(),
        });

        const valid = userSchema.validate(req.body);

        if (valid.err) {
            req.session.errMessage = "Invalid input",
            res.status(400);
            return res.redirect("/signup");
        }

        if (req.body.password != req.body.repassword) {
            req.session.errMessage = "Passwords must match";
            res.status(400);
            return res.redirect("/signup");
        }

        let hashedPassword = await bcrypt.hash(req.body.password, salt);

        users.insertOne({
            email: req.body.email,
            // name: req.body.name,
            password: hashedPassword,
        }).then((results, err) => {
            if (err) {
                res.status(500);
                console.error(err);
                return res.send("Internal server error");
            }

            // TODO: Add session handling here and auto redirect to home and be authenticated
            req.session.errMessage = "Please login to view that resource";
            res.status(200);
            return res.redirect("/login");
        });
    });
}
