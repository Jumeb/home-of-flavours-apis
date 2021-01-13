const express = require('express');
const {body} = require('express-validator');

const userController = require('../controllers/user');
const User = require('../model/user');

const router = express.Router();

router.post('/user/register', [
    body('email')
        .isEmail()
        .withMessage('Enter a valid email')
        .custom((value , {req}) => {
            return User.findOne({email: value})
            .then(userDoc => {
                if(userDoc) {
                    return Promise.reject('E-mail is already in use.');
                }
            });
        })
        .normalizeEmail(),
        body('password').trim().isLength({min: 5}),
        body('name').trim().isLength({min: 5})
], userController.register);

router.post('/user/login', userController.login);

module.exports = router;