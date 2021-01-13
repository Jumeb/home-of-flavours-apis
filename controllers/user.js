const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../model/user');
const {errorCode, clearImage} = require('../utils/utilities');

exports.register = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        error.data = errors.array();
        console.log(error.data);
        throw error;
    }

    const name = req.body.name;
    const email = req.body.email;
    const telNo = req.body.tel;
    const password = req.body.password;

    console.log(telNo)

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                name: name,
                email: email,
                telNumber: telNo,
                password: hashedPassword,
            })
            return user.save();
        })
        .then(result => {
            res.status(201).json({message: 'User created', userId: result._id});
        })
        .catch(error => {
            errorCode(error, 500, next);
        })

}

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;

    User.findOne({email: email})
        .then(user => {
            if (!user) {
                const error = new Error('User seems to be invalid');
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;
            return bcrypt(password, user.password);
        })
        .then(isEqual => {
            if(!isEqual) {
                const error = new Error('Wrong credentials');
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign({
                email: loadedUser.email,
                userId: loadedUser._id.toString(),
                name: loadedUser.name
            }, 
                'somesupersecret',
                {expiresIn: '90d' }
            );
            res.status(200).json({token: token, userId: loadedUser._id.toString()})
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}