require('dotenv').config();
const fs = require('fs');
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const customerRegistrationHtmlTemplate = fs.readFileSync('./emails/registration.html', 'utf-8');
const verifyEmailCustomerHTMLTemplate = fs.readFileSync('./emails/verifyemail_customer.html', 'utf-8');
const forgotPasswordHTMLTemplate = fs.readFileSync('./emails/forgotpassword.html', 'utf-8');

// AWS SDK v3 configurations
const sesClient = new SESClient({
  region: 'ap-south-1'
});

// Send email to the customer/admin
exports.sendEmail = (userName, verificationCode, sourceEmail, userInfo, isVerifyEmail) => {
    // Compose the email message with the verification code and change password button
    var emailSubject;
    var emailBody;

    if(verificationCode) {
      emailSubject = "Reset Your Password";
      if(userInfo.role === "admin") {
        const forgetPasswordLink = "https://"+process.env.FORGET_PASSWORD_LINK+"/change-password?username="+userName+"&code="+verificationCode;
        emailBody = forgotPasswordHTMLTemplate.replace("{{username}}", userInfo.name).replace("{{forgetpasswordLink}}", forgetPasswordLink);
      } else if(userInfo.role === "customer") {
        if(isVerifyEmail) {
          emailSubject = "Verify Email";
          emailBody = verifyEmailCustomerHTMLTemplate.replace("{{username}}", userInfo.name).replace("{{otp}}", verificationCode);
        } else {
          const forgetPasswordLink = "https://"+process.env.FORGET_PASSWORD_LINK+"/change-password?username="+userName+"&code="+verificationCode;
          emailBody = forgotPasswordHTMLTemplate.replace("{{username}}", userInfo.name).replace("{{forgetpasswordLink}}", forgetPasswordLink);
        }
       
      } else {
        Promise.reject({
          message: 'Error, You are associated with social Login account'
        });
      }
    } else {
      emailSubject = "Welcome to JKTeches";
      emailBody = customerRegistrationHtmlTemplate;
    } 
    
  
    // Compose the email parameters
    const emailParams = {
      Destination: {
        ToAddresses: [userName]
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: emailBody
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: emailSubject
        }
      },
      Source: sourceEmail // Replace with your SES verified email address
    };
  
    return new Promise((resolve, reject) => {
        // Send the email using Amazon SES
        sesClient.send(new SendEmailCommand(emailParams))
        .then(result => resolve(result))
        .catch(err => reject(err));
    })
}