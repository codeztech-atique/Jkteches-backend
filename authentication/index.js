require('dotenv').config()
const request = require('request');
const jwkToPem = require('jwk-to-pem');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const customRoles = require('../roles/index');
const client = new OAuth2Client();

const poolData = {
  UserPoolId: process.env.USER_POOL_ID,
  ClientId: process.env.APP_CLIENT_ID
};

const aws_region = process.env.POOL_REGION;


//Download jwsk.
const downloadJwk = (token, provider) => {
    let urlJwk;
    if (provider === 'cognito') { 
        urlJwk = `https://cognito-idp.${aws_region}.amazonaws.com/${poolData.UserPoolId}/.well-known/jwks.json`;
    } else if (provider === 'facebook') {
        urlJwk = 'https://graph.facebook.com/oauth/client_code';
    } else {
        throw new Error('Invalid provider');
    }
    return new Promise((resolve, reject) => {
        request({
            url: urlJwk,
            json: true
        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

const downloadJwkForLoggedInUser = () => {
    let urlJwk = `https://cognito-idp.${aws_region}.amazonaws.com/${poolData.UserPoolId}/.well-known/jwks.json`;
    
    return new Promise((resolve, reject) => {
        request({
            url: urlJwk,
            json: true
        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

const verifyIdToken = (token) => {
    let urlJwk = `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=`+token;
    
    return new Promise((resolve, reject) => {
        request({
            url: urlJwk,
            json: true
        }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

//Verify token.
exports.verify = (req, res, next) => {
    let { token, deviceType } = req.body;
    let provider = req.headers['provider'];
    return new Promise(async(resolve, reject) => {
        //Download jwkt from aws.

        if(provider === 'cognito') {
            downloadJwk(token, provider).then((body) => {
                let pems = {};
                let keys = provider === 'cognito' ? body['keys'] : body;
                
    
                for (let i = 0; i < keys.length; i++) {
                    let key_id, modulus, exponent, key_type;
                    if (provider === 'cognito') {
                        //Convert each key to PEM
                        key_id = keys[i].kid;
                        modulus = keys[i].n;
                        exponent = keys[i].e;
                        key_type = keys[i].kty;                   
                    }     
    
                    let jwk = {
                        kty: key_type,
                        n: modulus,
                        e: exponent
                    };
    
    
                    let pem = jwkToPem(jwk);
    
                    pems[key_id] = pem;
    
                }
    
                //validate the token
                let decodedJwt = jwt.decode(token, {
                    complete: true
                });
    
                //If is not valid.
                if (!decodedJwt)
                    reject({
                        "error": "Not a valid JWT token"
                    });
    
                let kid = decodedJwt.header.kid;
                let pem = pems[kid];
    
                if (!pem)
                    reject({
                        "error": "Invalid token"
                    });
    
                jwt.verify(token, pem, (err, payload) => {
    
                    if (err)
                        reject({
                            "error": "Invalid token"
                        });
                    else
                        resolve(payload);
                });
    
            }).catch((err) => {
                reject(err);
            })
        } else if(provider === 'google') {
            try {
                const payload = await verifyIdToken(token);
                resolve(payload);
              } catch (error) {
                console.log("Error in verifying token:", error);
                reject({"error": "Invalid token"});
              }
        } else if(provider === 'facebook') {
            resolve(req.body);
        } else {
            reject({"error": "Invalid Provider !!!"})
        }
    })
        
};

//Verify token.
exports.loggedInUsersVerifyToken = (req, res, next) => {
    let { token } = req.body;
    return new Promise(async(resolve, reject) => {
        //Download jwkt from aws.
        downloadJwkForLoggedInUser().then((body) => {
            let pems = {};
            
            let keys = body['keys'];
            

            for (let i = 0; i < keys.length; i++) {
                let key_id, modulus, exponent, key_type; 
                
                key_id = keys[i].kid;
                modulus = keys[i].n;
                exponent = keys[i].e;
                key_type = keys[i].kty;      

                let jwk = {
                    kty: key_type,
                    n: modulus,
                    e: exponent
                };


                let pem = jwkToPem(jwk);

                pems[key_id] = pem;

            }

            //validate the token
            let decodedJwt = jwt.decode(token, {
                complete: true
            });

            //If is not valid.
            if (!decodedJwt)
                reject({
                    "error": "Not a valid JWT token"
                });

            let kid = decodedJwt.header.kid;
            let pem = pems[kid];

            if (!pem)
                reject({
                    "error": "Invalid token"
                });

            jwt.verify(token, pem, (err, payload) => {
                if (err)
                    reject({
                        "error": "Invalid token"
                    });
                else
                    resolve(payload);
            });

        }).catch((err) => {
            reject(err);
        })
    })  
};

exports.verifyToken = async(req, res, next) => {
    try {
        let userVerified = await this.verify(req, res);
        console.log("========= User Verified ===========")
        req.body.userDetails = userVerified;
        next();
    } catch(err) {
        // Token expires
        console.log("Token expires send 401 auto logged out:")
        console.log(err);

        res.status(401).send({
            error: err
        })
    }
}

exports.loggedInUserVerifyToken = async(req, res, next) => {
    try {
        let userVerified = await this.loggedInUsersVerifyToken(req, res);
        console.log("========= User Verified ===========")
        req.body.userDetails = userVerified;
        next();
    } catch(err) {
        // Token expires
        console.log("Token expires send 401 auto logged out:")
        console.log(err);

        res.status(401).send({
            error: err
        })
    }
}

exports.commonPermission = (req, res, next) => {
   try {
      // Decode JWT and check the user if they are associated with any groups
      const userInfo = req.body.userDetails;
      if(userInfo) {
        if(
            (userInfo['cognito:groups'].indexOf(customRoles.ADMIN) > -1 || 
            userInfo['cognito:groups'].indexOf(customRoles.CUSTOMER) > -1)  
            // userInfo['email_verified'] == true
        ) {
           console.log("========= User Associated with "+userInfo['cognito:groups']+" roles ===========")
           next();
        } else {
            res.status(401).send({
                error: "Not authorized !!!"
            })
        }
      } else {
        res.status(401).send({
            error: "Not authorized !!!"
        })
      }
   } catch(err) {
        res.status(400).send({
            error: err
        })
   }
}