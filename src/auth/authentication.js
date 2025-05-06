const status = require("../util/statuses");
const bcrypt = require('bcrypt');
const joi = require("joi");
const salt = 12;

const middleware = require("./middleware");


module.exports = (users) => {
    const router = require("express").Router();

    router.get("/logout", (req, res) => {
        req.session.destroy();
        // res.status(status.Unauthorized);
        return res.redirect('/login');
    });
    
    router.post("/login", async (req, res) => {
      
        const credentialSchema = joi.object({
            email: joi.string().email().required(),
            password: joi.string().max(20).required(),
        });

        const valid = credentialSchema.validate(req.body);

        if (valid.err) {
            req.session.errMessage = "Invalid input";
            res.status(status.BadRequest);
            return res.redirect("/login");
        }

        users.findOne({ "email": req.body.email }).then((user) => {
            if (!user) {
                req.session.errMessage = "User not found";
                res.status(status.NotFound);
                return res.redirect("/login");
            }

            if (!bcrypt.compareSync(req.body.password, user.password)) {
                req.session.errMessage = "Incorrect password";
                res.status(status.Unauthorized);
                return res.redirect("/login");
            }

            console.log("User logged in successfully");
            console.log("User email: " + req.body.email);
            req.session.authenticated = true;
            req.session.email = req.body.email;
            req.session.errMessage = "";
            res.redirect("/home");
            return res.status(status.Ok);
        });
    });

    router.post("/signup", async (req, res) => {
        const userSchema = joi.object({
            email: joi.string().email().required(),
            // name: joi.string().alphanum().max(20).required(),
            password: joi.string().max(20).min(8).required(),
            repassword: joi.string().max(20).min(8).required(),
        });

        const valid = userSchema.validate(req.body);

        if (valid.err) {
            req.session.errMessage = "Invalid input",
            res.status(status.BadRequest);
            return res.redirect("/signup");
        }

        if (req.body.password != req.body.repassword) {
            req.session.errMessage = "Passwords must match";
            res.status(status.BadRequest);
            return res.redirect("/signup");
        }

        let hashedPassword = await bcrypt.hashSync(req.body.password, salt);

        users.insertOne({
            email: req.body.email,
            // name: req.body.name,
            password: hashedPassword,
        }).then((results, err) => {
            if (err) {
                res.status(status.InternalServerError);
                console.error(err);
                return res.send("Internal server error");
            }

            req.session.authenticated = true;
            req.session.email = req.body.email;

            req.session.errMessage = "";
            res.status(status.Ok);
            return res.redirect("/home");
        });
    });

    return router;
}
