const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    sub: { type: String, required: true },
    email_verified: { type: Boolean, required: true },
    cognito_user_status: { type: String, required: true },
    custom: {
      source: String,
      createdBy: String,
      name: String,
      about: String,
      dob: String,
      updatedBy: String,
      profileurl: String,
      deviceType: String,
      role: String
    },
    email: { type: String, required: true },
    status: { type: Boolean, require: true },
    createdAt:{ type: Date, default: Date.now},
    updatedAt: {type: Date, default: Date.now},
});

// Create the user model using the schema
const user = mongoose.model('User', userSchema);;

module.exports = user;