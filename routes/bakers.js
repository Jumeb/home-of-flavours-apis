const express = require("express");
const { body } = require("express-validator");

const bakersController = require("../controllers/bakers");
const isAuth = require('../middleware/isAuth');

const router = express.Router();

router.post('/baker/register', [
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
], bakersController.register)

router.post('/baker/login', bakersController.login);

router.put('/bakers/images/:bakerId',  isAuth, bakersController.editBakerImages)

router.put('/bakers/profile/:bakerId',  isAuth, bakersController.editBaker);

router.delete('/bakers/:bakerId',  isAuth, bakersController.deleteBaker);

module.exports = router;