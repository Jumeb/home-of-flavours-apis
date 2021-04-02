const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {validationResult} = require('express-validator');

exports.fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' 
        || file.mimetype === 'image/jpg' 
        || file.mimetype === 'image/jpeg'
        ) {
            cb(null, true);
    } else {
        cb(null, false);
    }
}


exports.fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-')  + '-' + file.originalname)
    }
});

exports.errorCode = (err, code, next) => {
    if(!err.statusCode) {
        err.statusCode = code;
    }
    next(err);
}

exports.clearImage = filePath => {
    // filePath = path.join(__dirname, '../images', filePath);
    filePath && fs.unlink(filePath, err => console.log(err, 'hahah'));
}

exports.validationError = (req, message, code) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(message);
        error.statusCode = code;
        error.data = errors.array();
        throw error;
    }
}

exports.authenticationError = (message, code) => {
    const error = new Error(message);
    error.statusCode = code;
    throw error;
}