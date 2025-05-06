const status = require("../util/statuses");
const bcrypt = require('bcrypt');
const joi = require("joi");
const salt = 12;

/**
 * @param {function} middleware handler
 * @param {MongoClient.collection} users db collection
 * @param {MongoClient.collection} assets db collection
 * @returns {express.Router} user protected routes router
 */
module.exports = (middleware, users, assets) => {
    const router = require("express").Router();
    
    router.use(middleware);

    router.get('/home', async (req, res) => {
        res.render('home', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/assets', (req, res) => {
        let assets = [
            {
                name: "hello my name is braeden! abc!",
                value: 1123.50,
            },
            {
                name: "asset 2",
                value: 321.05,
            },
            {
                name: "asset 3",
                value: 666,
            },
        ];
        res.render('assets', { user: req.user, assets: assets });
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
        res.render('profile', { user: req.user, errMessage: req.session.errMessage });
        return res.status(status.Ok);
    });

    router.get('/settings', (req, res) => {
        res.render('settings', { user: req.user });
        return res.status(status.Ok);
    });

    router.get('/questionnaire', (req, res) => {
        const errMessage = req.session.errMessage;
        req.session.errMessage = ""; 
        res.render('questionnaire', { user: req.user, errMessage: errMessage });
    });

    router.post('/questionnaire', (req, res) => {
        const questionnaireSchema = joi.object({
            dob: joi.date().required(),
            education: joi.string().valid('primary', 'secondary', 'tertiary', 'postgraduate').required(),
            maritalStatus: joi.string().valid('single', 'married', 'divorced', 'widowed').required(),
            income: joi.number().min(0).required(),
            expenses: joi.number().min(0).required(),
            assets: joi.number().min(0).required(),
            liabilities: joi.number().min(0).required(),
            retirementAge: joi.number().min(18).max(120).required(),
            retirementExpenses: joi.number().min(0).required(),
            retirementAssets: joi.number().min(0).required(),
            retirementLiabilities: joi.number().min(0).required(),
        });
    
        const validationOptions = { convert: true, abortEarly: false }; 
        const { error, value } = questionnaireSchema.validate(req.body, validationOptions);
    
        if (error) { 
            console.error("Questionnaire validation error:", error.details);
            req.session.errMessage = "Invalid input: " + error.details.map(d => d.message.replace(/"/g, '')).join(', '); 
            res.status(status.BadRequest).redirect("/questionnaire"); 
            return; 
        }
    
        users.updateOne( 
            { email: req.session.email }, 
            { 
                $set: { 
                    financialData: true, 
                    dob: value.dob,
                    education: value.education,
                    maritalStatus: value.maritalStatus,
                    income: value.income,
                    expenses: value.expenses,
                    assets: value.assets,
                    liabilities: value.liabilities,
                    retirementAge: value.retirementAge,
                    retirementExpenses: value.retirementExpenses,
                    retirementAssets: value.retirementAssets,
                    retirementLiabilities: value.retirementLiabilities,
                } 
            }
        ).then((result) => { 
            if (result.matchedCount === 0) {
                console.log(`User not found during questionnaire update: ${req.session.email}`);
                req.session.errMessage = "User session invalid. Please log in again."; 
                res.status(status.NotFound).redirect("/login"); 
                return;
            }
            if (result.modifiedCount === 0 && result.matchedCount === 1) {
                console.log(`User questionnaire data unchanged (already up-to-date): ${req.session.email}`);
            }
        
            req.session.errMessage = ""; 
            res.status(status.Ok).redirect("/home"); 
    
        }).catch(err => { 
            console.error("Error updating questionnaire in database:", err);
            req.session.errMessage = "An error occurred while saving your information. Please try again.";
            res.status(status.InternalServerError).redirect("/questionnaire"); 
        });
    });

    router.post("/updateAccount", async (req, res) => {
        const accountSchema = joi.object({
            email: joi.string().email(),
            name: joi.string().alphanum().max(20),
            password: joi.string().max(20).min(8),
            repassword: joi.string().max(20).min(8),
        });

        const valid = accountSchema.validate(req.body);

        if (valid.err) {
            req.session.errMessage = "Invalid input",
            res.status(status.BadRequest);
            return res.redirect("/profile");
        }

        let update = {
            // email: req.body.email,
            name: req.body.name,
        };

        if ((req.body.password != "") && (req.body.password != req.body.repassword)) {
            req.session.errMessage = "New passwords must match";
            res.status(status.BadRequest);
            return res.redirect("/profile");
        } else if (req.body.password != "") {
            let hashedPassword = await bcrypt.hashSync(req.body.password, salt);
            update.password = hashedPassword;
        }

        users.updateOne(
            { email: req.session.email },
            { $set: update }
        ).then((result) => {
            if (result.matchedCount === 0) {
                console.log(`User not found during account update: ${req.session.email}`);
                req.session.errMessage = "User session invalid. Please log in again."; 
                res.status(status.NotFound).redirect("/login"); 
                return;
            }
            if (result.modifiedCount === 0 && result.matchedCount === 1) {
                console.log(`User account data unchanged (already up-to-date): ${req.session.email}`);
            }
        
            req.session.errMessage = ""; 
            return res.status(status.Ok).redirect("/profile"); 
        }).catch(err => { 
            console.error("Error updating account in database:", err);
            req.session.errMessage = "An error occurred while saving your information. Please try again.";
            return res.status(status.InternalServerError).redirect("/profile"); 
        });
    });

    return router;
};
