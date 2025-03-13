const jwt = require('jsonwebtoken');

module.exports.generateToken = (userId) => {
    const jwtSecretKey = process.env.JWT_SECRET;
    const encryptionData = {
        time : Date(),
        userId : userId
    }

    const token = jwt.sign(encryptionData, jwtSecretKey);

    return token;
}