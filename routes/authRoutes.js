const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Authentication
const authentication = require('../authentication');

// Middleware
const middleware = require('../middleware/validation');

// Validate Token
const validateToken = require('../middleware/headerValidation');

// Controller
const authController = require('../controllers/authController');

app.post('/register', [middleware.validateRegisterUserAPI], (req, res) => {
   authController.register(req, res);
});

app.post('/verifyemail', [middleware.validateVerifyEmailAPI], (req, res) => {
   authController.verifyEmail(req, res);
});

app.post('/login', [middleware.validateLoginUserAPI], (req, res) => {
   authController.login(req, res);
});


app.post('/verifytoken', [middleware.validateVerifyTokenAPI], (req, res) => {
   authController.verifyToken(req, res);
});

app.post('/renewtoken', [middleware.validateRenewTokenAPI], (req, res) => {
   authController.renewToken(req, res);
});

app.post('/forgotpassword', (req, res) => {
   authController.forgotPassword(req, res);
});

app.post('/confirmpassword', (req, res) => {
   authController.confirmPassword(req, res);
});

app.post('/changepassword', [middleware.validateChangePasswordAPI, validateToken.bearerTokenPresent, authentication.loggedInUserVerifyToken], (req, res) => {
   authController.changePassword(req, res);
});


module.exports = app;