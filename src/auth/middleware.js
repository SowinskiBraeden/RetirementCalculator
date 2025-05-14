const status = require("../util/statuses");
const session = require("express-session");
const ObjectId = require("mongodb").ObjectId;

// Get all names of user routes
let userRouter = require("../router/user")((req, res, next) => next(), null, null, null);
userRouter.stack.shift();
const userRoutes = userRouter.stack.map((layer) => layer.route.path.split("/")[1]);

/**
 * @param {MongoClient.collection} users db collection
 * @returns {async function} middleware handler function
*/
const createMiddleware = (users) => {
    return async (req, res, next) => {
        // Check if incoming request route exists in user routes
        // redirect to 404 if not
        if (!userRoutes.includes(req.url.split("/")[1].split("?")[0])) {
            return res.status(status.NotFound).redirect("/notFound");
        }

        if (!req.session.authenticated || !req.session.userId) {
            req.session.errMessage = "Please login to view that resource";
            res.redirect("/login");
            return res.status(status.Unauthorized);
        }
        
        if (!req.session.user) {
            let user = await users.findOne({ _id: new ObjectId(req.session.userId) }).then((user) => user);
            if (!user) {
                return req.session.destroy((err) => {
                    if (err) {
                        console.error("Failed to destroy session: ", err);
                        req.session.errMessage = "Failed to logout. Please try again";
                        res.status(status.InternalServerError);
                        return res.redirect("/home");
                    }

                    req.session.errMessage = "User not found";
                    res.status(status.NotFound);
                    res.redirect("/login");
                });
            }

            req.session.user = user;
            return req.session.save((err) => {
                if (err) {
                    console.error("Failed to save session: ", err);

                    return req.session.destroy((err) => {
                        req.session.errMessage = "Failed to save session, please login again.";

                        if (err) {
                            console.error("Failed to destroy session: ", err);
                        }

                        res.status(status.InternalServerError);
                        res.redirect("/login");
                    });
                }

                next();
            });
        }

        next();
    };
};

module.exports = createMiddleware;
