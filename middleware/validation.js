require('dotenv').config()

const chalk = require('chalk');
const bucketUrl = process.env.BUCKET_NAME

// validate social registration api 
exports.validateSocialRegistrationAPI = (req, res, next) => {
  let provider = req.headers['provider'];
  var error = '';
  if(provider === 'google' || provider === 'cognito') {
    if (req.body.token === undefined || req.body.token === '') {
      console.log(chalk.red('token is missing'));
      error += "token, "
    } if (req.body.deviceType === undefined || req.body.deviceType === '') {
      console.log(chalk.red('deviceType is missing'));
      error += "deviceType, "
    } 
    if(req.body.profileurl === undefined || req.body.profileurl === '') {
      req.body.profileurl = "https://static.jkteches.com/user.png";
    }
    if (error !== '') {
      res.status(400).send({
        status: 400,
        message: error + ' is required !!!'
      });
    } else {
      next();
    }
  } else if(provider === 'facebook') {
    if (req.body.token === undefined || req.body.token === '') {
      console.log(chalk.red('token is missing'));
      error += "token, "
    }
    if (req.body.email === undefined || req.body.email === '') {
      console.log(chalk.red('email is missing'));
      error += "email, "
    }
    if (req.body.name === undefined || req.body.name === '') {
      console.log(chalk.red('name is missing'));
      error += "name, "
    }
    if(req.body.profileurl === undefined || req.body.profileurl === '') {
      req.body.profileurl = "https://static.jkteches.com/user.png";
    }
    if (req.body.deviceType === undefined || req.body.deviceType === '') {
      console.log(chalk.red('deviceType is missing'));
      error += "deviceType, "
    }
    if (req.body.id === undefined || req.body.id === '') {
      console.log(chalk.red('id is missing'));
      error += "id, "
    }
  
    if (error !== '') {
      res.status(400).send({
        status: 400,
        message: error + ' is required !!!'
      });
    } else {
      next();
    }
  } else if(!provider) {
    res.status(400).send({
      message: 'Provider is missing in the header !!!'
    })
  } else {
    res.status(400).send({
      message: 'Invalid provider !!!'
    })
  }
}

// validate social login api 
exports.validateSocialLoginAPI = (req, res, next) => {
  let provider = req.headers['provider'];
  var error = '';
  if(provider === 'google') {
    if (req.body.token === undefined || req.body.token === '') {
      console.log(chalk.red('token is missing'));
      error += "token, "
    } if (req.body.deviceType === undefined || req.body.deviceType === '') {
      console.log(chalk.red('deviceType is missing'));
      error += "deviceType, "
    } 
    if (error !== '') {
      res.status(400).send({
        status: 400,
        message: error + ' is required !!!'
      });
    } else {
      next();
    }
  } else if(provider === 'facebook') {
    if (req.body.email === undefined || req.body.email === '') {
      console.log(chalk.red('email is missing'));
      error += "email, "
    }
    if (req.body.deviceType === undefined || req.body.deviceType === '') {
      console.log(chalk.red('deviceType is missing'));
      error += "deviceType, "
    }
  
    if (error !== '') {
      res.status(400).send({
        status: 400,
        message: error + ' is required !!!'
      });
    } else {
      next();
    }
  } else if(!provider) {
    res.status(400).send({
      message: 'Provider is missing in the header !!!'
    })
  } else {
    res.status(400).send({
      message: 'Invalid provider !!!'
    })
  }
}

// Validate API
exports.validateLoginUserAPI = (req, res, next) => {
  // console.log();
  // console.log(chalk.bgYellowBright("---------------- Validated API Data ----------------"));
  var error = '';
  if (req.body.email === undefined || req.body.email === '') {
    console.log(chalk.red('email is missing'));
    error += "email, "
  }
  if (req.body.password === undefined || req.body.password === '') {
    console.log(chalk.red('password is missing'));
    error += "password, "
  } if (req.body.deviceType === undefined || req.body.deviceType === '') {
    console.log(chalk.red('deviceType is missing'));
    error += "deviceType, "
  } 
  
  if (error !== '') {
    res.status(400).send({
      status: 400,
      message: error + ' is required !!!'
    });
  } else {
    next();
  }
};

// Validate API
exports.validateManageUserAPI = (req, res, next) => {
  var error = '';
  if (req.body.email === undefined || req.body.email === '') {
    console.log(chalk.red('email is missing'));
    error += "email, "
  }
  if (req.body.status === undefined || req.body.status === '') {
    console.log(chalk.red('status is missing'));
    error += "status, "
  }
  if (error !== '') {
    res.status(400).send({
      status: 400,
      message: error + ' is required !!!'
    });
  } else {
    next();
  }
};

exports.validateLogoutUserAPI = (req, res, next) => {
  console.log(chalk.bgYellowBright("---------------- Validated API Data ----------------"));
  var error = '';
  if (req.body.id === undefined || req.body.id === '') {
    console.log(chalk.red('id is missing'));
    error += "id, "
  }
  if (req.body.userId === undefined || req.body.userId === '') {
    console.log(chalk.red('userId is missing'));
    error += "userId, "
  }
  if (req.body.email === undefined || req.body.email === '') {
    console.log(chalk.red('email is missing'));
    error += "email, "
  }
  if (error !== '') {
    res.status(400).send({
      status: 400,
      message: error + ' is required !!!'
    });
  } else {
    next();
  }
};


exports.validateRegisterUserAPI = (req, res, next) => {
  // console.log();
  // console.log(chalk.bgYellowBright("---------------- Validated API Data ----------------"));
  var error = '';
  req.body.createdBy = req.body.email;
  req.body.updatedBy = req.body.email;
  if (req.body.name === undefined || req.body.name === '') {
    let userName = req.body.email.split("@");
    req.body.name = userName[0];
  }

  if (req.body.email === undefined || req.body.email === '') {
    console.log(chalk.red('email is missing'));
    error += "email, "
  }
  if (req.body.password === undefined || req.body.password === '') {
    console.log(chalk.red('password is missing'));
    error += "password, "
  } 
  if (req.body.deviceType === undefined || req.body.deviceType === '') {
    console.log(chalk.red('deviceType is missing'));
    error += "deviceType, "
  }
  if (req.body.role === undefined || req.body.role === '') {
    console.log(chalk.red('role is missing'));
    error += "role, "
  }

  if (req.body.about === undefined || req.body.about === '') {
    console.log(chalk.red('aboutme is missing'));

    req.body.about = "I am "+req.body.role;
  }

  if (req.body.dob === undefined || req.body.dob === '') {
    console.log(chalk.red('date of birth is missing'));
    req.body.dob = "12/01/1985";
  }

  if(req.body.profileurl === undefined || req.body.profileurl === '') {
    req.body.profileurl = "https://static.jkteches.com/user.png";
  }

  if(req.body.source === undefined || req.body.source === '') {
    req.body.source = "custom";
  }

  if (error !== '') {
    res.status(400).send({
      status: 400,
      message: error + ' is required !!!'
    });
  } else {
    next();
  }
};

exports.validateChangePasswordAPI = (req, res, next) => {
  // console.log();
  // console.log(chalk.bgYellowBright("---------------- Validated API Data ----------------"));
  var error = '';
  if (req.body.email === undefined || req.body.email === '') {
    console.log(chalk.red('email is missing'));
    error += "email, "
  }
  if (req.body.password === undefined || req.body.password === '') {
    console.log(chalk.red('password is missing'));
    error += "password, "
  }
  if (req.body.newpassword === undefined || req.body.newpassword === '') {
    console.log(chalk.red('newpassword is missing'));
    error += "newpassword, "
  }
  if (error !== '') {
    res.status(400).send({
      status: 400,
      message: error + ' is required !!!'
    });
  } else {
    if(req.body.password != req.body.newpassword) {
      res.status(400).send({
        status: 400,
        message: 'Password and confirm password should be same.'
      });
    } else {
      next();
    }
  }
};

exports.validateVerifyTokenAPI = (req, res, next) => {
  // console.log();
  // console.log(chalk.bgYellowBright("---------------- Validated API Data ----------------"));
  var error = '';
  if (req.body.token === undefined || req.body.token === '') {
    console.log(chalk.red('token is missing'));
    error += "token, "
  }

  if (error !== '') {
    res.status(400).send({
      status: 400,
      message: error + ' is required !!!'
    });
  } else {
    next();
  }
};

exports.validateRenewTokenAPI = (req, res, next) => {
  // console.log();
  // console.log(chalk.bgYellowBright("---------------- Validated API Data ----------------"));
  var error = '';
  if (req.body.token === undefined || req.body.token === '') {
    console.log(chalk.red('token is missing'));
    error += "token, "
  }
  if (error !== '') {
    res.status(400).send({
      status: 400,
      message: error + ' is required !!!'
    });
  } else {
    next();
  }
};

exports.validateVerifyEmailAPI = (req, res, next) => {
  // console.log();
  // console.log(chalk.bgYellowBright("---------------- Validated API Data ----------------"));
  var error = '';
  if (req.body.email === undefined || req.body.email === '') {
    console.log(chalk.red('email is missing'));
    error += "user, "
  }
  if (req.body.code === undefined || req.body.code === '') {
    console.log(chalk.red('code is missing'));
    error += "code, "
  }
  if (error !== '') {
    res.status(400).send({
      status: 400,
      message: error + ' is required !!!'
    });
  } else {
    next();
  }
};


exports.validateUpdateProfile = (req, res, next) => {
  // console.log();
  // console.log(chalk.bgYellowBright("---------------- Validated API Data ----------------"));
  var error = '';

  if (req.body.email === undefined || req.body.email === '') {
    console.log(chalk.red('email is missing'));
    error += "email, "
  }
  
  if (error !== '') {
    res.status(400).send({
      status: 400,
      message: error + ' is required !!!'
    });
  } else {
    next();
  }
};