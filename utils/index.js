// Generate a random 6-digit verification code
exports.generateVerificationCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};