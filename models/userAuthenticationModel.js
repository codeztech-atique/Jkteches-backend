const mongoose = require('mongoose');

var user_authentication = new mongoose.Schema({
    email: { type: String },
    verificationCode: { type: String },
    createdAt:{ type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
});

var userAuthentication = mongoose.model('user_authentication', user_authentication);
module.exports = userAuthentication;