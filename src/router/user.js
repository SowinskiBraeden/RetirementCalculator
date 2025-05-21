const getRates = require("../util/exchangeRate");
const { calculateProgress, updatePlanProgressInDB, updateProgress, calculateTotalAssetValue } = require("../util/calculations");
const suggestions = require("../util/suggestions");
const status = require("../util/statuses");
const ObjectId = require('mongodb').ObjectId;
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const joi = require("joi");
const fs = require("fs");
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
                type: joi.string().valid("other", "stock", "saving").required(),
                icon: joi.string().alphanum().required(),
                name: joi.string().alphanum().min(3).max(30).required(),
                value: joi.number().min(0).required(),
                year: joi.number().min(1900).max(new Date().getFullYear()),
                purchaseDate: joi.date().required(),
                description: joi.string().max(240).min(0),
                id: joi.string().alphanum(), // May be passed when updating existing asset
                userId: joi.string().alphanum(),
            });
            break;
        case "saving":
            assetSchema = joi.object({
                type: joi.string().valid("other", "stock", "saving").required(),
                name: joi.string().alphanum().min(3).max(30).required(),
                value: joi.number().min(0).required(),
                id: joi.string().alphanum(), // May be passed when updating existing asset
                userId: joi.string().alphanum(),
            });
            break;
        case "stock":
            assetSchema = joi.object({
                type: joi.string().valid("other", "stock", "saving").required(),
                ticker: joi.string().alphanum().min(3).max(5).required(),
                price: joi.number().min(0).required(),
                quantity: joi.number().min(1).required(),
                purchaseDate: joi.date().required(),
                id: joi.string().alphanum(), // May be passed when updating existing asset
                userId: joi.string().alphanum(),
            });
            break;
        default:
            return null;
    };

    return assetSchema;
}

/** 
 * Function takes in a number and formats it to currency
 * @param {integer}
 * @returns nuber formatted in currency
 */

/**
 * @param {function} middleware handler
 * @param {MongoClient.collection} users db collection
 * @param {MongoClient.collection} assets db collection
 * @returns {express.Router} user protected routes router
 */
module.exports = (middleware, users, plans, assets) => {
    const router = require("express").Router();

    // Create list of icon filenames
    let icons = fs.readdirSync(path.join(__dirname, "../public/svgs/icons"));
    icons = icons.map((icon) => icon.split(".")[0]);

    router.use(middleware);

    router.get('/home', async (req, res) => {
        let user = req.session.user._id;
        // if no session with geoData
        if (!req.session.geoData) {
            req.session.geoData = {
                country: null,
                toCurrencyRates: [],
            };
        }
        const userPlansFromDB = await plans.find({ userId: new ObjectId(req.session.userId) }).toArray();

        for (const plan of userPlansFromDB) {
            const progress = await calculateProgress(plan, assets, users, req.session.user._id);
            await updatePlanProgressInDB(plan._id, progress.percentage, plans);
        }

        const updatedUserPlans = await plans.find({ userId: new ObjectId(req.session.user._id) }).toArray();

        res.render('dashboard', {
            user: req.session.user,
            geoData: req.session.geoData,
            plans: updatedUserPlans,
        });

        return res.status(status.Ok);
    });

    router.get('/assets', async (req, res) => {
        let userAssets = await assets.find({ userId: new ObjectId(req.session.userId) }).toArray();
        let totalUserAssetValue = await calculateTotalAssetValue(userAssets);

        res.render('assets', {
            user: req.session.user,
            errMessage: req.session.errMessage,
            assets: userAssets,
            geoData: req.session.geoData,
            totalUserAssetValue: totalUserAssetValue,
            icons: icons,
        });
        return res.status(status.Ok);
    });

    router.get('/plans', async (req, res) => {
        try {

            const updatedUserPlans = await updateProgress(plans, assets, users, req.session.user._id);
            
            res.render('plans', {
                user: req.session.user,
                plans: updatedUserPlans,
                geoData: req.session.geoData
            });
        } catch (err) {
            console.error("Error fetching plans:", err);
            req.session.errMessage = "Could not load your plans. Please try again.";
            res.status(status.InternalServerError).redirect('/home');
        }
    });

    router.get('/plans/:id', async (req, res) => {

        try {
            const planId = req.params.id;
            let userAssets = await assets.find({ userId: new ObjectId(req.session.userId) }).toArray();
            let totalUserAssetValue = await calculateTotalAssetValue(userAssets);

            if (!ObjectId.isValid(planId)) {
                req.session.errMessage = "Invalid plan ID format.";
                return res.status(status.BadRequest).redirect('/plans');
            }
            const plan = await plans.findOne({ userId: new ObjectId(req.session.userId), _id: new ObjectId(planId) });

            if (!plan) {
                req.session.errMessage = "Plan not found or you do not have permission to view it.";
                return res.status(status.NotFound).redirect('/plans');
            }

            const progress = await calculateProgress(plan, assets, users, req.session.userId);

            res.render('planDetail', {
                user: req.session.user,
                plan: plan, 
                geoData: req.session.geoData,
                totalUserAssetValue: totalUserAssetValue,
                assets: userAssets,
                progress: progress, 
                suggestions: await suggestions.generateSuggestions(),
            });

        } catch (err) {
            console.error("Error fetching plan:", err);
            req.session.errMessage = "Could not load your plan. Please try again.";
            res.status(status.InternalServerError).redirect('/home');
        }
    });

    router.get('/newPlan', (req, res) => {
        if (!req.session.user.financialData || !req.session.user) {
            req.session.errMessage = "Please complete your financial data before creating a plan.";
            return res.status(status.Unauthorized).redirect('/questionnaire');
        }
        const errMessage = req.session.errMessage;
        req.session.errMessage = "";
        res.render('newPlan', {
            user: req.session.user,
            errMessage: errMessage,
            geoData: req.session.geoData
        });
    });

    router.post('/newPlan', async (req, res) => {
        const planSchema = joi.object({
            name: joi.string().min(3).max(100).required(),
            retirementAge: joi.number().min(18).max(120).required(),
            retirementExpenses: joi.number().min(0).required(),
            retirementAssets: joi.number().min(0).required(),
            retirementLiabilities: joi.number().min(0).required(),
        });

        const validationOptions = { convert: true, abortEarly: false };
        const { error, value } = planSchema.validate(req.body, validationOptions);

        if (error) {
            console.error("Plan validation error:", error.details);
            const errorMessage = "Invalid input: " + error.details.map(d => d.message.replace(/"/g, '')).join(', ');
            res.status(status.BadRequest).json({ success: false, message: errorMessage });
            return;
        }

        const planToInsert = {
            userId: new ObjectId(req.session.userId),
            name: value.name,
            retirementAge: value.retirementAge,
            retirementExpenses: value.retirementExpenses,
            retirementAssets: value.retirementAssets,
            retirementLiabilities: value.retirementLiabilities,
            progress: "0" 
        };

        try {
            await plans.insertOne(planToInsert);
            res.status(status.Ok).json({ success: true, message: "Plan created successfully." });
        }
        catch (err) {
            console.error("Error saving plan:", err);
            res.status(status.InternalServerError).json({ success: false, message: "An error occurred while saving your plan. Please try again." });
        }
    });

    router.delete('/plans/:id', async (req, res) => {
        const planId = req.params.id;
        const plan = await plans.findOne({ _id: new ObjectId(planId) });
        if(!plan) {
            console.log(`Plan not found with ID: ${planId}`);
            res.status(status.NotFound).json({ success: false, message: "Plan not found or you do not have permission to delete it." });
            return;
        }
        if(plan.userId.toString() !== req.session.userId) {
            console.log(`User ${req.session.userId} does not have permission to delete plan ${planId}`);
            res.status(status.Forbidden).json({ success: false, message: "You do not have permission to delete this plan." });
            return;
        }
        try {
            await plans.deleteOne({ _id: new ObjectId(planId) });
            res.status(status.Ok).json({ success: true, message: "Plan deleted successfully." });
        }
        catch (err) {
            console.error("Error deleting plan:", err);
            res.status(status.InternalServerError).json({ success: false, message: "An error occurred while deleting your plan. Please try again." });
        }
    });

    router.get('/plans/:id/edit', async (req, res) => {
        const planId = req.params.id;
        const plan = await plans.findOne({ _id: new ObjectId(planId) });
        if(!plan) {
            console.log(`Plan not found with ID: ${planId}`);
            res.status(status.NotFound).json({ success: false, message: "Plan not found or you do not have permission to edit it." });
            return;
        }
        if(plan.userId.toString() !== req.session.userId) {
            console.log(`User ${req.session.userId} does not have permission to edit plan ${planId}`);
            res.status(status.Forbidden).json({ success: false, message: "You do not have permission to edit this plan." });
            return;
        }
        res.render('editPlan', {
            user: req.session.user,
            plan: plan,
            geoData: req.session.geoData
        });
    });

    router.post('/plans/:id/edit', async (req, res) => {
        const planId = req.params.id;
        const plan = await plans.findOne({ _id: new ObjectId(planId) });
        if(!plan) {
            console.log(`Plan not found with ID: ${planId}`);
            res.status(status.NotFound).json({ success: false, message: "Plan not found or you do not have permission to edit it." });
            return;
        }
        if(plan.userId.toString() !== req.session.userId) {
            console.log(`User ${req.session.userId} does not have permission to edit plan ${planId}`);
            res.status(status.Forbidden).json({ success: false, message: "You do not have permission to edit this plan." });
            return;
        }

        const planSchema = joi.object({
            name: joi.string().min(3).max(100).required(),
            retirementAge: joi.number().min(18).max(120).required(),
            retirementExpenses: joi.number().min(0).required(),
            retirementAssets: joi.number().min(0).required(),
            retirementLiabilities: joi.number().min(0).required(),
        });

        // Object for Joi validation - only fields from req.body
        const dataToValidate = {
            name: req.body.name,
            retirementAge: Number(req.body.retirementAge),
            retirementExpenses: parseFloat(req.body.retirementExpenses),
            retirementAssets: parseFloat(req.body.retirementAssets),
            retirementLiabilities: parseFloat(req.body.retirementLiabilities),
        };

        const { error, value } = planSchema.validate(dataToValidate);
        if (error) {
            console.error("Plan validation error:", error.details);
            const errorMessage = "Invalid input: " + error.details.map(d => d.message.replace(/"/g, '')).join(', ');
            res.status(status.BadRequest).json({ success: false, message: errorMessage });
            return;
        }

        const progressCalculated = await calculateProgress(value, assets, users, req.session.userId);

        const planToSet = {
            name: value.name,
            retirementAge: value.retirementAge,
            retirementExpenses: value.retirementExpenses,
            retirementAssets: value.retirementAssets,
            retirementLiabilities: value.retirementLiabilities,
            progress: progressCalculated.percentage,
        };
        try {
            await plans.updateOne(
                { _id: new ObjectId(planId), userId: new ObjectId(req.session.userId) }, 
                { $set: planToSet }
            );
            await updateProgress(plans, assets, users, req.session.user._id);
            res.status(status.Ok).json({ success: true, message: "Plan updated successfully." });
        }
        catch (err) {
            console.error("Error updating plan:", err);
            res.status(status.InternalServerError).json({ success: false, message: "An error occurred while updating your plan. Please try again." });
        }
    });

    router.post('/fact', async (req, res) => {
        const factInput = req.body.fact;
        const fact = await suggestions.generateFact(factInput);
        return res.status(status.Ok).json({ fact });
    });

    router.get('/more', (req, res) => {
        res.render('more', {
            user: req.session.user,
            geoData: req.session.geoData
        });
        return res.status(status.Ok);
    });

    router.get('/profile', (req, res) => {
        res.render('profile', {
            user: req.session.user,
            errMessage: req.session.errMessage,
            geoData: req.session.geoData
        });
        return res.status(status.Ok);
    });

    router.get('/settings', (req, res) => {
        res.render('settings', {
            user: req.session.user,
            geoData: req.session.geoData
        });
        return res.status(status.Ok);
    });

    router.get('/questionnaire', (req, res) => {
        const errMessage = req.session.errMessage;
        req.session.errMessage = "";
        res.render('questionnaire', {
            user: req.session.user,
            errMessage: errMessage,
            geoData: req.session.geoData
        });
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
        });

        const validationOptions = { convert: true, abortEarly: false };
        const { error, value } = questionnaireSchema.validate(req.body, validationOptions);

        let referrer = req.get('Referrer') || "/home";
        if (error) {
            console.error("Questionnaire validation error:", error.details);
            req.session.errMessage = "Invalid input: " + error.details.map(d => d.message.replace(/"/g, '')).join(', ');
            let redirect = referrer.includes("?profile") ? "/questionnaire?profile" : "/questionnaire";
            res.status(status.BadRequest).redirect(redirect);
            return;
        }

        users.updateOne(
            { _id: new ObjectId(req.session.userId) },
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
                }
            }
        ).then((result) => {
            if (result.matchedCount === 0) {
                console.log(`User not found during questionnaire update: ${req.session.userId}`);
                req.session.errMessage = "User session invalid. Please log in again.";
                res.status(status.NotFound).redirect("/login");
                return;
            }
            if (result.modifiedCount === 0 && result.matchedCount === 1) {
                console.log(`User questionnaire data unchanged (already up-to-date): ${req.session.userId}`);
            }

            req.session.errMessage = "";
            req.session.user = null; // set user to null so middleware updates user
            req.session.save((err) => {
                if (err) {
                    console.error("Failed to save session: ", err);

                    return req.session.destroy((err) => {
                        req.session.errMessage = "Failed to save session, please login again.";

                        if (err) {
                            console.error("Failed to destroy session: ", err);
                        }

                        res.status(status.InternalServerError);
                        return res.redirect("/login");
                    });
                }

                let redirect = referrer.includes("?profile") ? "/profile" :
                    referrer != "/home" ? "/plans" : referrer;
                return res.status(status.Ok).redirect(redirect);
            });

        }).catch(err => {
            console.error("Error updating questionnaire in database:", err);
            req.session.errMessage = "An error occurred while saving your information. Please try again.";
            let redirect = referrer.includes("?profile") ? "/questionnaire?profile" : "/questionnaire";
            res.status(status.InternalServerError).redirect(redirect);
        });
    });

    router.post("/updateAccount", async (req, res) => {
        const accountSchema = joi.object({
            email: joi.string().email({ minDomainSegments: 2, tlds: { allow: true } }),
            name: joi.string().pattern(new RegExp('^[a-zA-Z]+$')).max(20),
            password: joi.string().max(20).min(8),
            repassword: joi.string().max(20).min(8),
        });

        const valid = accountSchema.validate(req.body);

        if (valid.error) {
            req.session.errMessage = "Invalid input:" + valid.error.details.map(d => d.message.replace(/"/g, '')).join(', ');
            res.status(status.BadRequest);
            return res.redirect("/profile");
        }

        let update = {
            email: req.body.email,
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
            { _id: new ObjectId(req.session.userId) },
            { $set: update }
        ).then((result) => {
            if (result.matchedCount === 0) {
                console.log(`User not found during account update: ${req.session.userId}`);
                req.session.errMessage = "User session invalid. Please log in again.";
                res.status(status.NotFound).redirect("/login");
                return;
            }
            if (result.modifiedCount === 0 && result.matchedCount === 1) {
                console.log(`User account data unchanged (already up-to-date): ${req.session.userId}`);
            }

            req.session.errMessage = "";
            req.session.user = null; // set user to null so middleware updates user
            req.session.save((err) => {
                if (err) {
                    console.error("Failed to save session: ", err);

                    return req.session.destroy((err) => {
                        req.session.errMessage = "Failed to save session, please login again.";

                        if (err) {
                            console.error("Failed to destroy session: ", err);
                        }

                        res.status(status.InternalServerError);
                        return res.redirect("/login");
                    });
                }

                return res.status(status.Ok).redirect("/profile");
            });

        }).catch(err => {
            console.error("Error updating account in database:", err);
            req.session.errMessage = "An error occurred while saving your information. Please try again.";
            return res.status(status.InternalServerError).redirect("/profile");
        });
    });

    router.post("/updatePersonal", (req, res) => {
        const questionnaireSchema = joi.object({
            dob: joi.date().required(),
            education: joi.string().valid('primary', 'secondary', 'tertiary', 'postgraduate').required(),
            maritalStatus: joi.string().valid('single', 'married', 'divorced', 'widowed').required(),
            income: joi.number().min(0).required(),
            expenses: joi.number().min(0).required(),
            assets: joi.number().min(0).required(),
            liabilities: joi.number().min(0).required(),
        });

        const validationOptions = { convert: true, abortEarly: false };
        const { error, value } = questionnaireSchema.validate(req.body, validationOptions);

        if (error) {
            console.error("Personal info validation error:", error.details);
            req.session.errMessage = "Invalid input: " + error.details.map(d => d.message.replace(/"/g, '')).join(', ');
            res.status(status.BadRequest).redirect("/profile");
            return;
        }

        users.updateOne(
            { _id: new ObjectId(req.session.userId) },
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
                }
            }
        ).then((result) => {
            if (result.matchedCount === 0) {
                console.log(`User not found during personal info update: ${req.session.userId}`);
                req.session.errMessage = "User session invalid. Please log in again.";
                res.status(status.NotFound).redirect("/login");
                return;
            }
            if (result.modifiedCount === 0 && result.matchedCount === 1) {
                console.log(`User personal info unchanged (already up-to-date): ${req.session.userId}`);
            }

            req.session.errMessage = "";
            req.session.user = null; // set user to null so middleware updates user
            req.session.save((err) => {
                if (err) {
                    console.error("Failed to save session: ", err);

                    return req.session.destroy((err) => {
                        req.session.errMessage = "Failed to save session, please login again.";

                        if (err) {
                            console.error("Failed to destroy session: ", err);
                        }

                        res.status(status.InternalServerError);
                        return res.redirect("/login");
                    });
                }

                return res.status(status.Ok).redirect("/profile");
            });

        }).catch(err => {
            console.error("Error updating personal info in database:", err);
            req.session.errMessage = "An error occurred while saving your information. Please try again.";
            res.status(status.InternalServerError).redirect("/profile");
        });
    });

    router.post("/createAsset", (req, res) => {
        // Create asset, each asset has different data structure based on type
        const type = req.body.type;
        const assetSchema = getAssetSchema(type);

        if (!assetSchema) {
            console.error("Modified asset type, rejected");
            req.session.errMessage = "Invalid input";
            return res.status(status.BadRequest).redirect("/assets");
        }

        const valid = assetSchema.validate(req.body);

        if (valid.error) {
            req.session.errMessage = "Invalid input:" + valid.error.details.map(d => d.message.replace(/"/g, '')).join(', ');
            res.status(status.BadRequest);
            return res.redirect("/assets");
        }

        let newAsset = {
            userId: new ObjectId(req.session.userId),
            ...req.body,
            updatedAt: new Date(),
        };

        if (type == "stock") {
            newAsset.quantity = parseInt(newAsset.quantity);
            newAsset.price = parseFloat(newAsset.price)
            newAsset.value = newAsset.quantity * newAsset.price;
            newAsset.name = `${newAsset.ticker} Stock`;
        }
        if (type == "other" && newAsset.year != "") newAsset.year = parseInt(newAsset.year);
        newAsset.value = parseFloat(newAsset.value);
        newAsset.icon = type == "stock" ? "Stock" : type == "saving" ? "Coins" : newAsset.icon;

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

    router.post("/updateAsset", (req, res) => {
        const type = req.body.type;
        const assetSchema = getAssetSchema(type);

        if (!assetSchema) {
            console.error("Modified asset type, rejected");
            req.session.errMessage = "Invalid input";
            return res.status(status.BadRequest).redirect("/assets");
        }

        const valid = assetSchema.validate(req.body);

        if (valid.error) {
            req.session.errMessage = "Invalid input:" + valid.error.details.map(d => d.message.replace(/"/g, '')).join(', ');
            res.status(status.BadRequest);
            return res.redirect("/assets");
        }

        if (req.body.userId != req.session.userId) {
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
        if (type == "other" && update.year != "") update.year = parseInt(update.year);
        update.value = parseFloat(update.value);
        delete update.id;
        delete update.userId;

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
                console.error(`Asset not found: ${req.body.id}`);
                req.session.errMessage = "Unable to delete asset. Please try again.";
                return res.status(status.NotFound).redirect("/assets");
            }

            if (!result.acknowledged) {
                console.error("Error deleting asset: ", err);
                req.session.errMessage = "An error occurred while deleting an asset. Please try again.";
                return res.status(status.InternalServerError).redirect("/assets");
            }

            req.session.errMessage = "";
            return res.status(status.Ok).redirect("/assets");

        }).catch((err) => {
            console.error("Error deleting asset: ", err);
            req.session.errMessage = "An error occurred while deleting an asset. Please try again.";
            return res.status(status.InternalServerError).redirect("/assets");
        });
    });

    router.post("/deleteUser", (req, res) => {
        // not as critical if results aren't as expected only if crashing
        assets.deleteMany({ userId: new ObjectId(req.session.userId) }).catch((err) => {
            console.error("Error deleting user assets: ", err);
            req.session.errMessage = "An error occured while deleting your account. Please try again.";
            return res.status(status.InternalServerError).redirect("/profile");
        });

        plans.deleteMany({ userId: new ObjectId(req.session.userId) }).catch((err) => {
            console.error("Error deleting user assets: ", err);
            req.session.errMessage = "An error occured while deleting your account. Please try again.";
            return res.status(status.InternalServerError).redirect("/profile");
        });

        users.deleteOne(
            { _id: new ObjectId(req.session.userId) },
        ).then((result) => {
            if (result.deletedCount === 0) {
                console.error(`User not found: ${req.body.id}`);
                req.session.errMessage = "Unabled to delete account. Please try again.";
                return res.status(status.NotFound).redirect("/profile");
            }

            if (!result.acknowledged) {
                console.error("Error deleting user: ", err);
                req.session.errMessage = "An error occured while deleting your account. Please try again.";
                return res.status(status.InternalServerError).redirect("/profile");
            }

            // Direct to logout to destroy session
            req.session.destroy();
            return res.status(status.Ok).redirect("/signup");
        }).catch((err) => {
            console.error("Error deleting user: ", err);
            req.session.errMessage = "An error occured while deleting your account. Please try again.";
            return res.status(status.InternalServerError).redirect("/profile");
        });
    });

    router.get("/exRates/:lat/:lon", async (req, res) => {
        if (!req.session.geoData.country) {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${req.params.lat},${req.params.lon}&result_type=country&key=${process.env.GEOLOCATION_API}`);
            const data = await response.json();

            country = data.results[0].formatted_address;
            let results = await getRates(country);

            if (!results.exRates) {
                req.session.geoData = {
                    message: "error"
                }
            } else {
                req.session.geoData = {
                    country: results.abbreviation,
                    toCurrencyRates: results.exRates,
                    geoData: req.session.geoData
                }
            }

        }

        return res.status(status.Ok).send({ data: req.session.geoData });
    })

    return router;
};
