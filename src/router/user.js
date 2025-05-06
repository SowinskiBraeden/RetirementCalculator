const status = require("../util/statuses");
const joi = require("joi");

module.exports = (middleware, users) => {
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
        res.render('profile', { user: req.user });
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
        console.log("Questionnaire POST body:", req.body);
    
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

    return router;
};
