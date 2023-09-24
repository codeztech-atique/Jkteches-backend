require('dotenv').config();
const { AdminUpdateUserAttributesCommand, CognitoIdentityProviderClient } = require("@aws-sdk/client-cognito-identity-provider");
const user = require('../models/userModel');

// AWS SDK v3 configurations
const cognitoISP = new CognitoIdentityProviderClient({
    region: process.env.POOL_REGION
});

exports.getUserDetails = async(body) => {
  try {
    // Find the user by email and update the status field
    const result = await user.findOne({ email: body.email });
    return result;
  } catch(err) {
      console.log('Error updating user status:', err);
  }
}

exports.updateUserStatus = async(email, status) => {
    try {
        // Find the user by email and update the status field
        const result = await user.updateOne({ email }, { $set: { status: status } });
        if (result.nModified === 1) {
            console.log(`User with email '${email}' status updated to ${status}.`);
        } else {
            console.log(`User with email '${email}' not found.`);
        }
    } catch(err) {
        console.log('Error updating user status:', error);
    }
}

exports.updateUserEmailStatus = async(email, status) => {
    try {
        // Find the user by email and update the status field
        const result = await user.updateOne({ email }, { $set: { email_verified: status } });
        if (result.nModified === 1) {
            console.log(`User with email '${email}' status updated to ${status}.`);
        } else {
            console.log(`User with email '${email}' not found.`);
        }
    } catch(err) {
        console.log('Error updating user status:', error);
    }
}

exports.findUserAll = async(limit) => {
    // Check if the user already present then no need to send the verification code
    try {
        const users = await user.find({}).limit(limit);
        return users;
    } catch(err) {
        console.log('Error checking user existence:', err);
        throw new Error('Error checking user existence');
    }
}

exports.updateUserDetails = async(body) => {
    try {
        // First update the user name in cognito
        const updateUserName = await this.updateCognitoUserName(body);
        const updateUserDetailsINdB = await this.updateUserProfile(body);
        if(updateUserName && updateUserDetailsINdB) {
            return true;
        }
    } catch(err) {
        throw new Error('Error in user update.');
    }
}


// First update the user name in cognito
exports.updateCognitoUserName = async(body) => {
    try {
        const updateUserAttributesParams = {
            UserPoolId: process.env.USER_POOL_ID,
            Username: body.email,
            UserAttributes: [
              {
                Name: "custom:about",
                Value: body.about,
              },
              {
                Name: "custom:dob",
                Value: body.dob,
              },
            ],
        };
    
        const updateUserAttributesCommand = new AdminUpdateUserAttributesCommand(updateUserAttributesParams);
        await cognitoISP.send(updateUserAttributesCommand);
        // If the update is successful, return true
        return true;
      } catch (err) {
          console.log('Error in user name update:', err);
          // If there's an error, return false
          return false;
      }
}

exports.updateUserProfile = async (body) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Find the user document based on the email
        const existingUser = await user.findOne({ email: body.email });

        if (!existingUser) {
          throw new Error('User not found.');
        }

        // Update the fields in the existing user document
        existingUser.custom.about = body.about;
        existingUser.custom.dob = body.dob;

        // Save the updated user document
        const updatedUser = await existingUser.save();
        resolve(updatedUser);
      } catch (error) {
        reject(error);
      }
    });
};
