const status = require("../util/statuses");

/**
 * createMiddleware returns a middleware function for express.
 * @param {MongoClient.collection} users
 * @return {async function} 
 */
const createMiddleware = (users) => {
    return async (req, res, next) => {
        if (!req.session.authenticated || !req.session.email) {
            req.session.errMessage = "Please login to view that resource";
            res.redirect("/login");
            return res.status(status.Unauthorized);
        }
    
        let user = await users.findOne({ "email": req.session.email }).then((user) => user);

        if (!user) {
            req.session.errMessage = "User not found";
            res.redirect("/login");
            return res.status(status.Unauthorized);
        }
    
        req.user = user;
        next();
    };
}

module.exports = createMiddleware;
