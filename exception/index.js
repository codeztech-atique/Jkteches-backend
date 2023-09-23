module.exports.userException = (key) => {
    switch(key) {
        case 'UsernameExistsException': 
            return {
                message: 'User already exists. Please log in or use a different email for signup.',
                exception: 'UsernameExistsException'
            }
        case 'NotAuthorizedException': 
            return {
                message: 'Login Failed, User name & password are incorrect. Please try again.',
                exception: 'NotAuthorizedException'
            }
        case 'BadFormatException': 
            return {
                message: 'Bad format',
                exception: 'BadFormatException'
            }
        case 'InvalidPasswordException': 
            return {
                message: `Invalid password, Password should be 6 character'`,
                exception: 'InvalidPasswordException'
            }
        default: 
            return {
                message: 'Something went wrong.',
                exception: 'InternalServerError'
            }    
    }
}