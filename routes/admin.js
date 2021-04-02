const express = require('express');
const {body} = require('express-validator');

const router = express.Router();
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/isAuth');
const Admin = require('../model/admin');

///////////////////////////////////////////
///                                    ///
///         Admins routes              ///
///                                    ///
//////////////////////////////////////////

router.post('/admin/register', [
    body('email')
        .isEmail()
        .withMessage('Enter a valid email')
        .custom((value , {req}) => {
            return Admin.findOne({email: value})
            .then(userDoc => {
                if(userDoc) {
                    return Promise.reject('E-mail is already in use.');
                }
            });
        })
        .normalizeEmail(),
        body('password').trim().isLength({min: 5}),
        body('name').trim().isLength({min: 5})
], adminController.register);

router.post('/admin/login', adminController.login);


///////////////////////////////////////////
///                                    ///
///         Bakers routes              ///
///                                    ///
//////////////////////////////////////////

router.get('/bakers', adminController.getVerifiedBakers);

router.get('/rawbakers', isAuth, adminController.getBakers);

router.get('/allbakers', isAuth, adminController.getAllBakers);

router.get('/bakers/:bakerId', isAuth, adminController.getBaker)

router.post(
    '/create/baker',  isAuth, 
    [
        body('name')
            .trim()
            .isLength({min: 5}),
        body('categories')
            .isLength({min: 1}),
    ], 
    adminController.createBaker
);

router.put('/baker/suspend/:bakerId', isAuth, adminController.suspendBaker);

router.put('/baker/verify/:bakerId', isAuth, adminController.verifyBaker);

router.delete('/baker/delete/:bakerId',  isAuth, adminController.deleteBaker);


///////////////////////////////////////////
///                                    ///
///         Users routes               ///
///                                    ///
//////////////////////////////////////////


router.get('/users', isAuth, adminController.getUsers);

router.get('/allusers', isAuth, adminController.getAllUsers);

router.get('/users/:userId', isAuth, adminController.getUser);

router.put('/user/suspend/:userId', isAuth, adminController.suspendUser);

router.delete('/user/delete/:userId', isAuth, adminController.deleteUser);

module.exports = router;
