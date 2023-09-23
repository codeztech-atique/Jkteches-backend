const ROLE = require('../roles/index')

// Define all the permissions of role.

// Customer Permission
exports.customerPermission = (req, res, next) => {
    const userInfo = req.body.userDetails;
    if(userInfo) {
        if(userInfo['cognito:groups'].indexOf(ROLE.CUSTOMER) > -1) {
            console.log("========= File Upload Permission Granted, User has "+userInfo['cognito:groups']+" roles ===========")
            next();
        } else {
            res.status(401).send({
                error: "Not authorized !!!"
            })
        }
    }
}


// Admin Permission
exports.adminPermission = (req, res, next) => {
    const userInfo = req.body.userDetails;
    if(userInfo) {
        if(userInfo['cognito:groups'].indexOf(ROLE.ADMIN) > -1) {
            console.log("========= Permission Granted, User has "+userInfo['cognito:groups']+" roles ===========")
            next();
        } else {
            res.status(401).send({
                error: "Not authorized !!!"
            })
        }
    }
}

// Common Permission
exports.commonPermission = (req, res, next) => {
    const userInfo = req.body.userDetails;
    if(userInfo) {
        if(userInfo['cognito:groups'].indexOf(ROLE.ADMIN) > -1 || userInfo['cognito:groups'].indexOf(ROLE.CUSTOMER) > -1) {
            console.log("========= Permission Granted, User has "+userInfo['cognito:groups']+" roles ===========")
            next();
        } else {
            res.status(401).send({
                error: "Not authorized !!!"
            })
        }
    }
}