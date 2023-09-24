// This is for Social login Apple, Facebook and Google, by default email will be verified here. 

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Authentication
const authentication = require('../authentication');

// Middleware
const middleware = require('../middleware/validation');


// Controller
const authController = require('../controllers/socialAuthController');

app.post('/register', [middleware.validateSocialRegistrationAPI, authentication.verifyToken], (req, res) => {
   authController.register(req, res);
});

app.post('/login', [middleware.validateSocialLoginAPI, authentication.verifyToken], (req, res) => {
   authController.login(req, res);
});

module.exports = app;