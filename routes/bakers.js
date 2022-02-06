const express = require("express");
const {
    body
} = require("express-validator");

const bakersController = require("../controllers/bakers");
const isAuth = require('../middleware/isAuth');
const Baker = require('../model/baker');

const router = express.Router();

router.post('/baker/register', [
    body('email')
    .isEmail()
    .withMessage('Enter a valid email')
    .custom((value, {
        req
    }) => {
        return Baker.findOne({
                email: value
            })
            .then(bakerDoc => {
                if (bakerDoc) {
                    return Promise.reject('E-mail is already is use.');
                }
            });
    })
    .normalizeEmail(),
    body('idCard')
    .custom((value, {
        req
    }) => {
        return Baker.findOne({
                idCardNumber: value
            })
            .then(bakerDoc => {
                if (bakerDoc) {
                    return Promise.reject(`Id card number ${value} is already in use.`);
                }
            });
    }),
    body('password').trim().isLength({
        min: 5
    }),
    body('name').trim().isLength({
        min: 5
    })
], bakersController.register)

router.post('/baker/location/:bakerId', bakersController.postLocation);

router.post('/baker/login', bakersController.login);

router.post('/baker/like/:bakerId', isAuth, bakersController.likeBaker);

router.post('/baker/dislike/:bakerId', isAuth, bakersController.dislikeBaker);

router.post('/baker/follow/:bakerId', isAuth, bakersController.followBaker);

router.put('/baker/images/:bakerId', bakersController.editBakerImages);

router.put('/baker/logo/:bakerId', bakersController.editBakerLogo);

router.put('/baker/profile/:bakerId', isAuth, bakersController.editBaker);

router.put('/baker/editlocation/:bakerId', bakersController.editLocation);

router.delete('/bakers/:bakerId', isAuth, bakersController.deleteBaker);

module.exports = router;