const express = require('express');
const bodyParser = require('body-parser');
const app = express();


app.use(bodyParser.json());

// Controller
const userController = require('../controllers/userController');

// Authentication
const authentication = require('../authentication');

// Middleware
const middleware = require('../middleware/headerValidation');

// Middleware API Validation
const middlewareAPI = require('../middleware/validation');

// Permission
const permissions = require('../permission/index');


// Sample API testing without bearerTokenPresent
app.get('/', (req, res) => {
   res.status(200).send({
      message:'App is working fine!'
   });
});

// Test API with bearerTokenPresent
app.post('/test', [middleware.bearerTokenPresent, authentication.loggedInUserVerifyToken, authentication.commonPermission], (req, res) => {
   res.send({
      status: 200,
      message: "Test Success !!!"
   })
});

// Enable and Disable User
app.post('/status', [middleware.bearerTokenPresent, authentication.loggedInUserVerifyToken, permissions.adminPermission, middlewareAPI.validateManageUserAPI], (req, res) => {
   userController.manageUser(req, res);
});

// Get All the Users
app.get('/all', [middleware.bearerTokenPresent, authentication.loggedInUserVerifyToken, permissions.adminPermission], (req, res) => {
   userController.getAllUsers(req, res);
});



// User profile page get
app.post('/profile', [middleware.bearerTokenPresent, authentication.loggedInUserVerifyToken, permissions.commonPermission], (req, res) => {
   userController.getProfile(req, res);
});


// User profile page update
app.put('/profile', [middleware.bearerTokenPresent, authentication.loggedInUserVerifyToken, middlewareAPI.validateUpdateProfile, permissions.commonPermission], (req, res) => {
   userController.updateProfile(req, res);
});

module.exports = app;
