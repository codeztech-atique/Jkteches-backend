require('dotenv').config();
const { AdminUpdateUserAttributesCommand, AdminInitiateAuthCommand, AdminCreateUserCommand, AdminAddUserToGroupCommand, ForgotPasswordCommand, AdminSetUserPasswordCommand, CognitoIdentityProviderClient, AdminConfirmSignUpCommand, SignUpCommand, InitiateAuthCommand, ConfirmSignUpCommand, UpdateUserAttributesCommand, InvalidEmailRoleAccessPolicyException } = require("@aws-sdk/client-cognito-identity-provider");
const { generateVerificationCode } = require('../utils/index'); 
const userAttributes = require('../dao/googleUsers');
const User = require('../models/userModel');
const userAuthentication = require('./userAuthentication');
const sendEmailToUser = require('./sendEmail');
const cognito = require('../services/cognito.js');
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
        console.log('Error in user assign to group:', err);
        throw new Error(`Error in user assign to group:`+err);
    }
}

// Manually verify the user's email
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


// Confirm User manually
const confirmUser = async(body) => {
    const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: body.email,
        Password: 'Password123!@#', // Set the same temporary password
        Permanent: true,
    });
  
    try {
      const userConfirmed = await cognitoISP.send(setPasswordCommand);
      return userConfirmed;
    } catch (err) {
        console.log('Confirm user failed:', err);
        throw new Error(`Confirm user failed:`+err);
    }
}


// Save User to the Database
const saveUserToDB = (body) => {
    // Map the user attributes to the user model fields
    const userData = {
        sub: body.userDetails.sub,
        email_verified: body.email_verified,
        cognito_user_status: "CONFIRMED",
        custom: {
            source: body.source,
            createdBy: body.createdBy,
            name: body.name,
            updatedBy: body.updatedBy,
            profileurl: body.profileUrl,
            about: body.about,
            dob: body.dob,
            deviceType: body.deviceType,
            role: 'customer'
        },
        email: body.email,
        status: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
   
    // Create a new user instance using the mapped data
    const user = new User(userData);
    
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

const saveUserToDB_FB = (body) => {
    // Map the user attributes to the user model fields
    const userData = {
        sub: body.id,
        email_verified: true,
        cognito_user_status: "CONFIRMED",
        custom: {
            source: body.source,
            createdBy: body.createdBy,
            name: body.name,
            updatedBy: body.updatedBy,
            profileurl: body.profileUrl,
            about: body.about,
            dob: body.dob,
            deviceType: body.deviceType,
            role: 'customer'
        },
        email: body.email,
        status: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
   
    // Create a new user instance using the mapped data
    const user = new User(userData);
    
    return new Promise(async(resolve, reject) => {
        try {
            // Save the user to MongoDB
            const saveUser = await user.save();
            resolve('User details successfully save to database.')
        } catch(err) {
            reject("Error:", err);
        }
    })
}



const saveUserToDB_APPLE = (body) => {
    // Map the user attributes to the user model fields
    const userData = {
        sub: body.id,
        email_verified: true,
        cognito_user_status: "CONFIRMED",
        custom: {
            source: body.source,
            createdBy: body.createdBy,
            name: body.name,
            updatedBy: body.updatedBy,
            profileurl: body.profileUrl,
            deviceType: body.deviceType,
            role: 'customer'
        },
        email: body.email,
        status: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

   
    // Create a new user instance using the mapped data
    const user = new User(userData);
    
    return new Promise(async(resolve, reject) => {
        try {
            // Save the user to MongoDB
            const saveUser = await user.save();
            resolve('User details successfully save to database.')
        } catch(err) {
            console.log("Not able to save to database:", err);
            reject("Error:", err);
        }
    })
}

// Registered With Google
exports.registerWithGoogle = (body) => {
   return new Promise(async(resolve, reject) => {
        try {
            body.source = 'google';
            const customAttributeList = userAttributes.daoUserAttributes(body);
            const signUpCommand = new AdminCreateUserCommand({
                UserPoolId: process.env.USER_POOL_ID,
                ClientId: process.env.APP_CLIENT_ID,
                Username: body.email,
                TemporaryPassword: 'Password123!@#', // Set a temporary password
                UserAttributes: customAttributeList,
                ValidationData: [
                    { Name: 'email', Value: body.email },
                ],
                MessageAction: 'SUPPRESS',
            });

            
            const signUpComplete = await cognitoISP.send(signUpCommand);
            const verifyCustomerEmail = await verifyEmail(body);
            const userConfirmed = await confirmUser(body);
            const userAddedToGroup = await assignUserToAGroup(body);
            const saveUserToDatabase = await saveUserToDB(body);

            const userUserLogin = await cognito.logIn(body.email, 'Password123!@#');
            resolve(userUserLogin);  

            // Send email to the user if he is a customer
            if(body.role == "customer") {
                await sendEmailToUser.sendEmail(body.email, null, sourceEmail);
            }
  
        } catch (err) {
            reject(err);
        }
   })
}

// Registered With Facebook
exports.registerWithFacebook = (body) => {
    return new Promise(async(resolve, reject) => {
         try {
             body.source = 'facebook';
             const customAttributeList = userAttributes.daoUserAttributes(body);
             const signUpCommand = new AdminCreateUserCommand({
                 UserPoolId: process.env.USER_POOL_ID,
                 ClientId: process.env.APP_CLIENT_ID,
                 Username: body.email,
                 TemporaryPassword: 'Password123!@#', // Set a temporary password
                 UserAttributes: customAttributeList,
                 ValidationData: [
                     { Name: 'email', Value: body.email },
                 ],
                 MessageAction: 'SUPPRESS',
             });
 
             
             const signUpComplete = await cognitoISP.send(signUpCommand);
             const verifyCustomerEmail = await verifyEmail(body);
             const userConfirmed = await confirmUser(body);
             const userAddedToGroup = await assignUserToAGroup(body);
             const saveUserToDatabase = await saveUserToDB_FB(body);
             const userUserLogin = await cognito.logIn(body.email, 'Password123!@#');
             resolve(userUserLogin);  

            
             // Send email to the user if he is a customer
             if(body.role == "customer") {
                await sendEmailToUser.sendEmail(body.email, null, sourceEmail);
             }
            
   
         } catch (err) {
             reject(err);
         }
    })
}

exports.signup = (body, provider) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(provider === 'google') {
                body.createdBy = body.userDetails.email;
                body.updatedBy = body.userDetails.email;
                body.name = body.userDetails.name;
                body.email = body.userDetails.email;
                body.profileUrl = body.userDetails.picture;
                body.email_verified = body.userDetails.email_verified;
    
                const registeredWithGoogle = await this.registerWithGoogle(body);
                resolve(registeredWithGoogle)
            } else if(provider === 'facebook') {
                body.createdBy = body.email;
                body.updatedBy = body.email;
                body.email_verified = true;

                
                const registeredWithFacebook = await this.registerWithFacebook(body);
                resolve(registeredWithFacebook)
            } else {
                reject({
                    error: 'We are not supporting '+provider+" right now."
                })
            }
        } catch(err) {
            reject(err);
        }
    })
}

exports.loginUserWithSocial = async(body) => {
    try {
        const params = {
            AuthFlow: "ADMIN_NO_SRP_AUTH",
            UserPoolId: process.env.USER_POOL_ID,
            ClientId: process.env.APP_CLIENT_ID,
            AuthParameters: {
                USERNAME: body.email, // Use email as the username
                PASSWORD: 'Password123!@#', // Provide a temporary password (it will be ignored for this AuthFlow)
            },
        };
      
        const initiateAuthCommand = new AdminInitiateAuthCommand(params);
        const authResponse = await cognitoISP.send(initiateAuthCommand);

        // Extract tokens from the response
        const idToken = authResponse.AuthenticationResult.IdToken;
        const accessToken = authResponse.AuthenticationResult.AccessToken;
        const refreshToken = authResponse.AuthenticationResult.RefreshToken;

        return ({
            accessToken : accessToken,
            idToken : idToken,
            refreshToken: refreshToken
        });
    } catch(err) {
        console.log("Error:", err);
        return null;
    }
}

exports.login = (body, provider) => {
    return new Promise(async(resolve, reject) => {
        if(provider === 'google') {
            body.createdBy = body.userDetails.email;
            body.updatedBy = body.userDetails.email;
            body.name = body.userDetails.name;
            body.email = body.userDetails.email;
            body.email_verified = body.userDetails.email_verified;
    
            const loginWithGoogle = await this.loginUserWithSocial(body);
            if(!loginWithGoogle) {
                reject('Login Failed, User name & password are incorrect. Please try again.')
            } else {
                resolve(loginWithGoogle)
            }
        } else if(provider === 'facebook' || provider === 'apple') {
            body.createdBy = body.email;
            body.updatedBy = body.email;
            body.email_verified = true;
            const loginWithFacebook = await this.loginUserWithSocial(body);;
            if(!loginWithFacebook) {
                reject('Login Failed, User name & password are incorrect. Please try again.')
            } else {
                resolve(loginWithFacebook)
            }
        } else {
            reject({
                error: 'We are not supporting '+provider+" right now."
            })
        }
    })
}

