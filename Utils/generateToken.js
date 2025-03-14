const jwt = require('jsonwebtoken');

module.exports.generateToken = (id) => {
    const jwtSecretKey = process.env.JWT_SECRET;
    const encryptionData = {
        time : Date(),
        userId : id
    }

    const token = jwt.sign(encryptionData, jwtSecretKey);

    return token;
}