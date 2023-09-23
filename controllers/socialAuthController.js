const userAuth = require('../services/userAuthenticationSocial');
const exception = require('../exception/index')
const cognito = require('../services/cognito.js');

exports.register = async function (req, res) {
  try {
    let provider = req.headers['provider'];
    req.body.role = "customer";
    //Send to cognito the signup request.
    let result = await userAuth.signup(req.body, provider);
    res.status(200).json(result);

  } catch (err) {
    console.log(err);
    const getException = exception.userException(err.name)
    res.status(400).json(getException);
  }
}

exports.login = async function (req, res) {
  const {
    body
  } = req;

  //Validate request format.
  if (body) {
    try {
      // Send to cognito the login request.
      let provider = req.headers['provider'];
      let result = await userAuth.login(body, provider);
      res.status(200).json(result);
      // Save the device type.
      await cognito.saveDeviceTypeInCognito(body);
    } catch (err) {
      res.status(400).json({
        "message": err
      });
    }
  } else {
    res.status(400).json({
      "error": "bad format"
    });
  }
}
