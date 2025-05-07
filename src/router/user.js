const status = require("../util/statuses");
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require("bcrypt");
const joi = require("joi");
const salt = 12;

/**
 * getAssetSchema returns correct joi object
 * to validate req.body depending on asset type
 * @param {string} type of asset
 * @returns {joi.object} schema
 */
const getAssetSchema = (type) => {
    let assetSchema;

    switch (type) {
        case "other":
            assetSchema = joi.object({
                ownerId: joi.string().alphanum().required(),
                type: joi.string().valid("other", "stock", "saving").required(),
                name: joi.string().alphanum().min(3).max(30).required(),
                value: joi.number().min(0).required(),
                purchaseDate: joi.date().required(),
                description: joi.string().alphanum().max(240),
                id: joi.string().alphanum(), // May be passed when updating existing asset
            });
            break;
        case "saving":
            assetSchema = joi.object({
                ownerId: joi.string().alphanum().required(),
                type: joi.string().valid("other", "stock", "saving").required(),
                name: joi.string().alphanum().min(3).max(30).required(),
                value: joi.number().min(0).required(),
                id: joi.string().alphanum(), // May be passed when updating existing asset
            });
            break;
        case "stock":
            assetSchema = joi.object({
                ownerId: joi.string().alphanum().required(),
                type: joi.string().valid("other", "stock", "saving").required(),
                ticker: joi.string().alphanum().min(3).max(5).required(),
                price: joi.number().min(0).required(),
                quantity: joi.number().min(1).required(),
                purchaseDate: joi.date().required(),
                id: joi.string().alphanum(), // May be passed when updating existing asset
            });
            break;
        default:
            return null;
    };

    return assetSchema;
}

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
        res.render('home', { user: req.session.user });
        return res.status(status.Ok);
    });

    router.get('/assets', async (req, res) => {
        let userAssets = await assets.find({ "ownerId": req.session.user._id }).toArray();
        res.render('assets', { user: req.session.user, assets: userAssets });
        return res.status(status.Ok);
    });

    router.get('/plans', (req, res) => {
        res.render('plans', { user: req.session.user });
        return res.status(status.Ok);
    });

    router.get('/more', (req, res) => {
        res.render('more', { user: req.session.user });
        return res.status(status.Ok);
    });

    router.get('/profile', (req, res) => {
        res.render('profile', { user: req.session.user, errMessage: req.session.errMessage });
        return res.status(status.Ok);
    });

    router.get('/settings', (req, res) => {
        res.render('settings', { user: req.session.user });
        return res.status(status.Ok);
    });

    router.get('/questionnaire', (req, res) => {
        const errMessage = req.session.errMessage;
        req.session.errMessage = ""; 
        res.render('questionnaire', { user: req.session.user, errMessage: errMessage });
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

    router.post("/createAsset", async (req, res) => {
        // Create asset, each asset has different data structure based on type
        const type = req.body.type;
        const assetSchema = getAssetSchema(type);

        if (!assetSchema) {
            console.error("Modified asset type, rejected");
            req.session.errMessage = "Invalid input";
            return res.status(status.BadRequest).redirect("/assets");
        }

        const valid = assetSchema.validate(req.body);

        if (valid.err) {
            req.session.errMessage = "Invalid input",
            res.status(status.BadRequest);
            return res.redirect("/assets");
        }

        let newAsset = {
            ...req.body,
            updatedAt: new Date(),
        };

        if (type == "stock") {
            newAsset.quantity = parseInt(newAsset.quantity);
            newAsset.price = parseFloat(newAsset.price)
            newAsset.value = newAsset.quantity * newAsset.price;
            newAsset.name = `${newAsset.ticker} Stock`;
        }
        newAsset.value = parseFloat(newAsset.value);

        assets.insertOne(newAsset, (err, _) => {
            if (err) {
                console.error("Error creating asset: ", err);
                req.session.errMessage = "Internal server error";
                return res.status(status.InternalServerError).redirect("/assets");
            }
        });

        req.session.errMessage = ""; 
        return res.status(status.Ok).redirect("/assets");
    });

    router.post("/updateAsset", async (req, res) => {
        const type = req.body.type;
        const assetSchema = getAssetSchema(type);

        if (!assetSchema) {
            console.error("Modified asset type, rejected");
            req.session.errMessage = "Invalid input";
            return res.status(status.BadRequest).redirect("/assets");
        }
        
        const valid = assetSchema.validate(req.body);

        if (valid.err) {
            req.session.errMessage = "Invalid input",
            res.status(status.BadRequest);
            return res.redirect("/assets");
        }

        if (req.body.ownerId != req.session.user._id) {
            req.session.errMessage = "Cannot change asset owner",
            res.status(status.BadRequest);
            return res.redirect("/assets");
        }

        let update = { ...req.body, updatedAt: new Date() };
        if (type == "stock") {
            update.quantity = parseInt(update.quantity);
            update.price = parseFloat(update.price)
            update.value = update.quantity * update.price;
            update.name = `${update.ticker} Stock`;
        }
        update.value = parseFloat(update.value);
        delete update.id
        
        assets.updateOne(
            { "_id": new ObjectId(req.body.id) },
            { $set: update },
        ).then((result) => { 
            if (result.matchedCount === 0) {
                console.log(`Asset not found: ${req.body.id}`);
                req.session.errMessage = "Unable to update asset";
                return res.status(status.NotFound).redirect("/assets");
            }
            if (result.modifiedCount === 0 && result.matchedCount === 1) {
                console.log(`Asset data unchanged (already up-to-date): ${req.body.id}`);
            }
        
            req.session.errMessage = ""; 
            return res.status(status.Ok).redirect("/assets"); 
    
        }).catch((err) => { 
            console.error("Error updating asset: ", err);
            req.session.errMessage = "An error occurred while saving your information. Please try again.";
            return res.status(status.InternalServerError).redirect("/assets"); 
        });
    });

    router.post("/deleteAsset", (req, res) => {
        const id = new ObjectId(req.body.id);

        assets.deleteOne(
            { "_id": id }
        ).then((result) => { 
            if (result.deletedCount === 0) {
                console.log(`Asset not found: ${req.body.id}`);
                req.session.errMessage = "Unable to delete asset";
                return res.status(status.NotFound).redirect("/assets");
            }

            if (!result.acknowledged) {
                console.error("Error updating asset: ", err);
                req.session.errMessage = "An error occurred while saving your information. Please try again.";
                return res.status(status.InternalServerError).redirect("/assets");
            }
        
            req.session.errMessage = ""; 
            return res.status(status.Ok).redirect("/assets"); 
    
        }).catch((err) => { 
            console.error("Error updating asset: ", err);
            req.session.errMessage = "An error occurred while saving your information. Please try again.";
            return res.status(status.InternalServerError).redirect("/assets");
        });
    });

    return router;
};
