const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if(!authHeader) {
        const error = new Error('User not authenticated');
        error.statusCode = 404;
        throw error;
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    
    try {
        decodedToken = jwt.verify(token, 'somesupersecret');
    } catch (err) {
        const error = new Error('User not authenticated');
        error.statusCode = 500
        throw error;
    }
    if(!decodedToken) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }

    req.authId = decodedToken.userId;
    next();
}