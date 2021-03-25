const express = require("express");
const { body } = require("express-validator");

const bakersController = require("../controllers/bakers");
const isAuth = require('../middleware/isAuth');
const Baker = require('../model/baker');

const router = express.Router();

router.post('/baker/register', [
        body('email')
        .isEmail()
        .withMessage('Enter a valid email')
        .custom((value , {req}) => {
            return Baker.findOne({email: value})
            .then(bakerDoc => {
                if(bakerDoc) {
                    return Promise.reject('E-mail is already in use.');
                }
            });
        })
        .normalizeEmail(),
        body('idCard')
        .custom((value , {req}) => {
            return Baker.findOne({idCardNumber: value})
            .then(bakerDoc => {
                if(bakerDoc) {
                    return Promise.reject(`Id card number ${value} is already in use.`);
                }
            });
        }),
        body('password').trim().isLength({min: 5}),
        body('name').trim().isLength({min: 5})
], bakersController.register)

router.post('/baker/login', bakersController.login);

router.post('/baker/like/:bakerId', bakersController.likeBaker);

router.post('/baker/dislike/:bakerId', bakersController.dislikeBaker);

router.post('/baker/follow/:bakerId', bakersController.followBaker);

router.put('/bakers/images/:bakerId',  isAuth, bakersController.editBakerImages)

router.put('/baker/profile/:bakerId', isAuth, bakersController.editBaker);

router.delete('/bakers/:bakerId', isAuth, bakersController.deleteBaker);

module.exports = router;