const config = require('config');
const { v4: uuidv4 } = require('uuid');
const cognito = require('../services/cognito.js');
const user = require('../services/user.js');

const multipartUploadUUID = uuidv4();


// Get All User
exports.getAllUsers = async(req, res) => {
  try {
    const limit = config.get('userLimit');
    const result = await user.findUserAll(limit);
    res.status(200).send(result);
  } catch(err) {
    res.status(400).send({
      error: err
    })
  }
}


// Enable and disable user
exports.manageUser = async(req, res) => {
   try {
     const result = await cognito.manageUser(req.body);
     res.status(200).send(result);
   } catch(err) {
     res.status(400).send({
      error: err
     })
   }
}


exports.getProfile = async(req, res) => {
  try {
     const getProfileDetails = await user.getUserDetails(req.body);
     res.send(getProfileDetails)
  } catch(err) {
    res.status(400).send({
      error: err,
    });
  }
}

exports.updateProfile = async(req, res) => {
  try {
     const updateProfile = await user.updateUserDetails(req.body);
     if(updateProfile) {
        res.send({
          message: 'User details successfully updated !!!'
        })
     } else {
        res.status(400).send({
          message: 'User details not updated !!!'
        })
     }
  } catch(err) {
    res.status(400).send({
      error: err,
    });
  }
}