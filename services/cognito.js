require('dotenv').config();
const { AdminGetUserCommand, AdminEnableUserCommand, AdminUpdateUserAttributesCommand, AdminDisableUserCommand, RespondToAuthChallengeCommand, AdminInitiateAuthCommand, AdminAddUserToGroupCommand, ForgotPasswordCommand, AdminSetUserPasswordCommand, CognitoIdentityProviderClient, AdminConfirmSignUpCommand, SignUpCommand, InitiateAuthCommand } = require("@aws-sdk/client-cognito-identity-provider");
const { generateVerificationCode } = require('../utils/index'); 
const userAttributes = require('../dao/cognitoUsers');
const userAuthentication = require('./userAuthentication');
const sendEmailToUser = require('./sendEmail');
const userModel = require('../models/userModel');
const user = require('./user');
const config = require('config');
const sourceEmail = config.get('sourceEmail'); 


// AWS SDK v3 configurations
const cognitoISP = new CognitoIdentityProviderClient({
  region: process.env.POOL_REGION
});

// Assign User to a group
const assignUserToAGroup = async(body) => {
  const params = new AdminAddUserToGroupCommand({
    UserPoolId: process.env.USER_POOL_ID,
    Username: body.email,
    GroupName: body.role,
  });

  try {
    const userAddedToGroup = await cognitoISP.send(params);
    return userAddedToGroup;
  } catch (err) {
    throw err;
  }
}

// Confirm User manually
const confirmUser = async(body) => {
  const params = new AdminConfirmSignUpCommand({
    UserPoolId: process.env.USER_POOL_ID,
    Username: body.email,
   });

  try {
    const userConfirmed = await cognitoISP.send(params);
    return userConfirmed;
  } catch (err) {
    throw err;
  }
}

// Save User to the Database
const saveUserToDB = (body, signUpComplete) => {
  // Map the user attributes to the user model fields
  const userData = {
      sub: signUpComplete.UserSub,
      email_verified: body.role === 'customer' ? false : true,
      cognito_user_status: "CONFIRMED",
      custom: {
          source: 'custom',
          createdBy: body.createdBy,
          name: body.name,
          about: body.about,
          dob: body.dob,
          updatedBy: body.updatedBy,
          profileurl: body.profileurl,
          deviceType: body.deviceType,
          role: body.role
      },
      email: body.email,
      status: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
  };
 
  // Create a new user instance using the mapped data
  const user = new userModel(userData);
  
  return new Promise(async(resolve, reject) => {
      try {
          // Save the user to MongoDB
          const saveUser = await user.save();
          resolve('User details successfully save to database.')
      } catch(err) {
          console.log("Not able to save in the database:", err);
          reject("Error:", err);
      }
  })
}

// Manually verify the user's email cognito
const verifyEmail = async (body) => {
  try {
    // Update the user's email verification status
    const updateUserAttributesParams = {
      UserPoolId: process.env.USER_POOL_ID,
      Username: body.email,
      UserAttributes: [
        {
          Name: "email_verified",
          Value: "true",
        },
      ],
    };

    const updateUserAttributesCommand = new AdminUpdateUserAttributesCommand(updateUserAttributesParams);
    await cognitoISP.send(updateUserAttributesCommand);
  } catch (err) {
      console.log('Error in user verify email:', err);
      throw new Error(`Error in user verify email:`+err);
  }
};

// Verify customer email with Code
const verifyEmailWithCode = async(body) => {
  return new Promise(async(resolve, reject) => {
    try {
       const validOTP = await userAuthentication.validateOTP(body.email, body.code);
       if(validOTP) {
          resolve({
              message: "Email successfully verifed !!!"
          })

          // Sync to the Cognito
          await verifyEmail(body);

          // Sync to the database
          await user.updateUserEmailStatus(body.email, true);
       } else {
          reject({
            message: "OTP Expires, Email not verified !!!"
          })
       }
    } catch(err) {
      resolve({
        message: "Email successfully verifed !!!"
      })
    }
  })
}

// Register a new user and return the data in a promise.
const signUp = (body) => {
  return new Promise(async(resolve, reject) => {
    try {
      const customAttributeList = userAttributes.daoUserAttributes(body);
      const signUpCommand = new SignUpCommand({
        ClientId: process.env.APP_CLIENT_ID,
        Password: body.password,
        Username: body.email,
        UserAttributes: customAttributeList,
        ValidationData: [
          { Name: 'email', Value: body.email },
        ],
      });
      
      const signUpComplete = await cognitoISP.send(signUpCommand);

      
      if(body.role == "admin") {
        await verifyEmail(body);
      }

      const userConfirmed = await confirmUser(body);
      const userAddedToGroup = await assignUserToAGroup(body);
      const saveUser = await saveUserToDB(body, signUpComplete);
      const userUserLogin = await logIn(body.email, body.password);

      resolve(userUserLogin);  

      

      // Send email to the user if he is a customer / will be in async
      if(body.role == "customer") {
        

        // Generate a verification code
        const verificationCode = generateVerificationCode();

        // Store the verification code to database for 15 minutes
        const storeVerificationCode = await userAuthentication.saveUserAuthentication(body.email, verificationCode);

        // Send welcome email to the customer when they signup
        await sendEmailToUser.sendEmail(body.email, null, sourceEmail);
        
        const getCustomerInfo = await userAuthentication.findUser(body.email);
        
        if(getCustomerInfo) {
          // Send email to the user with Verification Code
          await sendEmailToUser.sendEmail(body.email, verificationCode, sourceEmail, getCustomerInfo.custom, true);
        }
      }

    } catch (err) {
      reject(err);
    }
  });
};


// Save the deviceType in the Cognito
const saveDeviceTypeInCognito = async(body) => {
    const deviceType = body.deviceType.toLowerCase();
    try {
      if(deviceType != "web") {
        // Retrieve the user's existing attributes, including custom:deviceType
        const adminGetUserParams = {
          UserPoolId: process.env.USER_POOL_ID,
          Username: body.email,
        };

        const { UserAttributes } = await cognitoISP.send(new AdminGetUserCommand(adminGetUserParams));

        // Find the custom:deviceType attribute
        const deviceTypeAttribute = UserAttributes.find(attr => attr.Name === "custom:deviceType");
        const deviceTypeData = deviceTypeAttribute.Value.toLowerCase();

        // Check if the user already has custom:deviceType containing "IOS"
        if (!deviceTypeAttribute || !deviceTypeData.includes(deviceType)) {
          // If not, update the attribute to include "IOS"
          const updatedDeviceType = (deviceTypeAttribute ? deviceTypeAttribute.Value + ", " : "") + deviceType;

          const adminUpdateUserAttributesParams = {
            UserPoolId: process.env.USER_POOL_ID,
            Username: body.email,
              UserAttributes: [
                  {
                      Name: "custom:deviceType",
                      Value: updatedDeviceType,
                  },
              ],
          };

          await cognitoISP.send(new AdminUpdateUserAttributesCommand(adminUpdateUserAttributesParams));

          // Update the MongoDB document as well
          await userModel.updateOne({ email: body.email }, { "custom.deviceType": updatedDeviceType });

        }
      }
    } catch(err) {
      console.log("Update in the deviceType:", err);
      return null;
    }
    
}


// Authenticate a user and return tokens in a promise.
const logIn = (email, password) => {
  return new Promise((resolve, reject) => {
    const initiateAuthCommand = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.APP_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    cognitoISP.send(initiateAuthCommand)
      .then(result => {
        const accessToken = result.AuthenticationResult.AccessToken;
        const idToken = result.AuthenticationResult.IdToken;
        const refreshToken = result.AuthenticationResult.RefreshToken;

        resolve({
          accessToken: accessToken,
          idToken: idToken,
          refreshToken: refreshToken,
        });
      })
      .catch(err => reject(err));
  });
};

// Authenticate user Renew token.
const renew = (token) => {
  return new Promise((resolve, reject) => {
    const initiateAuthCommand = new InitiateAuthCommand({
      ClientId: process.env.APP_CLIENT_ID,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: token,
      }
    });

    cognitoISP.send(initiateAuthCommand)
      .then(result => {
        const accessToken = result.AuthenticationResult.AccessToken;
        const idToken = result.AuthenticationResult.IdToken;
        const newRefreshToken = result.AuthenticationResult.RefreshToken;

        const retObj = {
          "access_token": accessToken,
          "id_token": idToken,
          "refresh_token": newRefreshToken,
        };
        resolve(retObj);
      })
      .catch(err => reject(err));
  });
};

// Forgot Password
const forgotPassword = (username, body) => {
  return new Promise(async(resolve, reject) => {
    // Generate a verification code
    const verificationCode = generateVerificationCode();

    // Store the verification code to database for 15 minutes
    const storeVerificationCode = await userAuthentication.saveUserAuthentication(username, verificationCode);

    // Get the customer role, from the database, based on the role, we need to send 2 diff email template. 
    // For Customer only - APP ( Android / IOS )
    // For Admin - Web
    const getCustomerInfo = await userAuthentication.findUser(username);
    if(getCustomerInfo) {

      // Send email to the user with Verification Code
      const response = await sendEmailToUser.sendEmail(username, verificationCode, sourceEmail, getCustomerInfo.custom);
      resolve(response);
    } else {
      reject({
        message: 'User not found expection !!!'
      })
    }
  });
};

const authenticateAndGetAccessToken = (username, password) => {
  return new Promise((resolve, reject) => {
    const adminInitiateAuthCommand = new AdminInitiateAuthCommand({
      UserPoolId: process.env.USER_POOL_ID,
      ClientId: process.env.APP_CLIENT_ID,
      AuthFlow: "ADMIN_NO_SRP_AUTH",
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    });

    cognitoISP.send(adminInitiateAuthCommand)
      .then(response => {
        if (response.ChallengeName === "NEW_PASSWORD_REQUIRED") {
          const respondToAuthChallengeCommand = new RespondToAuthChallengeCommand({
            ClientId: process.env.APP_CLIENT_ID,
            ChallengeName: "NEW_PASSWORD_REQUIRED",
            ChallengeResponses: {
              USERNAME: username,
              NEW_PASSWORD: password
            },
            Session: response.Session
          });

          cognitoISP.send(respondToAuthChallengeCommand)
            .then(authResponse => {
              const accessToken = authResponse.AuthenticationResult.AccessToken;
              resolve(accessToken);
            })
            .catch(err => reject(err));
        } else {
          const accessToken = response.AuthenticationResult.AccessToken;
          resolve(accessToken);
        }
      })
      .catch(err => reject(err));
  });
};

const confirmPasswordChange = (username, password) => {
  return new Promise((resolve, reject) => {
    authenticateAndGetAccessToken(username, password)
      .then(accessToken => {
        const adminSetUserPasswordCommand = new AdminSetUserPasswordCommand({
          UserPoolId: process.env.USER_POOL_ID,
          Username: username,
          Password: password,
          Permanent: true
        });

        cognitoISP.send(adminSetUserPasswordCommand)
          .then(() => {
            resolve();
          })
          .catch(err => reject(err));
      })
      .catch(err => reject(err));
  });
};

// Confirm Password
const confirmPass = (username, newPassword) => {
  return new Promise((resolve, reject) => {
    const changePasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: username,
      Password: newPassword,
    });

    cognitoISP.send(changePasswordCommand)
      .then(async(result) => {
        await confirmPasswordChange(username, newPassword);
        resolve(result);
      })
      .catch(err => reject(err));
  });
};

// Change password
const changePwd = (username, password, newPassword) => {
  return new Promise((resolve, reject) => {
    if(password != newPassword) {
        resolve({
          message: "Password and confirm password should be the same !!!"
        })
    } else {
      const changePasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: username,
        Password: password,
      });
  
      cognitoISP.send(changePasswordCommand)
        .then(async(result) => {
          await confirmPasswordChange(username, newPassword);
          resolve({
            message: 'Password changed successfully.'
          });
        })
        .catch(err => reject(err));
    }
  });
};

// Enable user
const enableUser = async(body) => {
  const params = {
    UserPoolId: process.env.USER_POOL_ID,
    Username: body.email,
  };

  try {
    const command = new AdminEnableUserCommand(params);
    await cognitoISP.send(command);
    await user.updateUserStatus(body.email, true);
    console.log(`User '${body.email}' has been enabled.`);
  } catch (error) {
    console.log(`Error enabling user '${body.email}':`, error);
    throw new Error(`Error enabling user '${body.email}':`, error);
  }
}

// Disable user
const disableUser = async(body) => {
  const params = {
    UserPoolId: process.env.USER_POOL_ID,
    Username: body.email,
  };

  try {
    const command = new AdminDisableUserCommand(params);
    await cognitoISP.send(command);
    await user.updateUserStatus(body.email, false);
    console.log(`User '${body.email}' has been enabled.`);
  } catch (error) {
    console.log(`Error enabling user '${body.email}':`, error);
    throw new Error(`Error enabling user '${body.email}':`, error);
  }
}

// Manage User
const manageUser = (body) => {
   return new Promise(async(resolve, reject) => {
      if(body.status) {
         const enable = await enableUser(body);
         resolve({
           message: body.email+' Successfully enable.'
         })
      } else {
        const disable = await disableUser(body);
        resolve({
           message: body.email+' Successfully disable.'
        })
      }
   })
}

module.exports.signUp = signUp;
module.exports.logIn = logIn;
module.exports.saveDeviceTypeInCognito = saveDeviceTypeInCognito;
module.exports.renew = renew;
module.exports.changePwd = changePwd;
module.exports.forgotPassword = forgotPassword;
module.exports.confirmPass = confirmPass;
module.exports.manageUser = manageUser;
module.exports.verifyEmailWithCode = verifyEmailWithCode;
