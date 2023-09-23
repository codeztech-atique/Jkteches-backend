const config = require('config');
const user = require('../models/userModel');
const userAuthentication = require('../models/userAuthenticationModel');

exports.findActiveUser = (email) => {
    // Check if the user already present then no need to send the verification code
    return userAuthentication.findOne({ email: email })
        .then((user) => {
        if (user) {
            // User with the provided email already exists
            return true;
        } else {
            // User with the provided email does not exist
            return false;
        }
    })
    .catch((err) => {
      console.log('Error checking user existence:', err);
      throw new Error('Error checking user existence');
    });
}

exports.findUserWithDefaultIds = (email) => {
    // Check if the user already present then no need to send the verification code
    return user.findOne({ email: email })
        .then((user) => {
        if (user) {
            // User with the provided email already exists
            if(user.custom.source === 'custom') {
                return true;
            } else {
                return user;
            }
        } else {
            // User with the provided email does not exist
            return false;
        }
    })
    .catch((err) => {
      console.log('Error checking user existence:', err);
      throw new Error('Error checking user existence');
    });
}

exports.findUser = (email) => {
    // Check if the user already present then no need to send the verification code
    return user.findOne({ email: email })
        .then((user) => {
        if (user) {
            // User with the provided email already exists
            return user;
        } else {
            // User with the provided email does not exist
            return false;
        }
    })
    .catch((err) => {
      console.log('Error checking user existence:', err);
      throw new Error('Error checking user existence');
    });
}

exports.validateOTP = (email, verficationCode) => {
    // Check if the user already present then no need to send the verification code
    return userAuthentication.findOne({ email: email })
        .then((user) => {
        if (user) {
            // User with the provided email already exists
            if(user.verificationCode == verficationCode) {
                return true;
            } else {
                return false;
            }
        } else {
            // User with the provided email does not exist
            return false;
        }
    })
    .catch((err) => {
      console.log('Error checking user existence:', err);
      throw new Error('Error checking user existence');
    });
}

exports.saveUserAuthentication = (username, verificationCode) => {
    return new Promise(async(resolve, reject) => {
        // Check if the index already exists
        userAuthentication.collection.indexExists('createdAt_1')
        .then((indexExists) => {
            if (indexExists) {
                resolve('Index already exists');
            } else {
                console.log("Expire After:", config.get('authenticationCodeExpireIn'))
                // Create the index with the desired options
                return userAuthentication.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: config.get('authenticationCodeExpireIn')});
            }
        })
        .then(() => {
            return userAuthentication.create({
                email: username,
                verificationCode: verificationCode
            });
        })
        .then((savedUserAuth) => {
            resolve('UserAuthentication record saved to the database.');
        })
        .catch((err) => {
            console.log('Error saving userAuthentication:', err);
            reject('Error saving userAuthentication');
        });
    });
};