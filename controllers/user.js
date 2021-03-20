const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../model/user');
const Pastry = require('../model/pastry');
const {errorCode, clearImage, validationError} = require('../utils/utilities');
const { populate } = require('../model/pastry');

exports.register = (req, res, next) => {
    validationError(req, 'Validation failed, entered data is incorrect', 422);

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
    validationError(req, 'Validation failed, entered data is incorrect', 422);
    
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;


    User.findOne({email: email})
        .then(user => {
            if (!user) {
                const error = new Error('User not found.');
                error.statusCode = 401;
                throw error;
            }
            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if(!isEqual) {
                const error = new Error('Invalid email or password');
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
            res.status(200).json({
                token: token, 
                user: loadedUser
            });
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}


exports.getCart = (req, res, next) => {
    validationError(req, 'An error occured', 422);
    const userId = req.params.userId;
    let pastries;

    User.findById(userId)
        .populate({
            path: 'cart.pastries.pastryId',
            populate: {
                path: 'creator',
                select: 'companyName name -_id '
            }
        })
        .then(user => {
            console.log(user.cart, 'fetched');
            let obj = {};
            pastries = user.cart.pastries;
            const data = (cart) => {
                cart.map((i) => {
                    let _baker = i.pastryId.creator.companyName.toString();
                    if(obj[_baker] === undefined) {
                        obj[_baker] = [i];
                        } else {
                            obj[_baker].push(i);  
                        } 
                    });
                    return obj;
            }
            let bakers = data(pastries);
            res.status(200)
                .json({
                    message: 'Success',
                    bakers: bakers,
                })
        })
}

exports.postCart = (req, res, next) => {
    const pastryId = req.params.pastryId;
    const userId = req.query.user;

    validationError(req, 'An error occured', 422);

    Pastry.findById(pastryId)
        .then(pastry => {
            User.findById(userId)
                .then(user => {
                    return user.addToCart(pastry._id);
                })
                .then(result => {
                    res.status(200)
                        .json({message: 'Success'})
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.subFromCart = (req, res, next) => {
    const pastryId = req.params.pastryId;
    const userId = req.query.user;

    validationError(req, 'An error occured', 422);

    Pastry.findById(pastryId)
        .then(pastry => {
            User.findById(userId)
                .then(user => {
                    return user.subFromCart(pastry._id);
                })
                .then(result => {
                    res.status(200)
                        .json({message: 'Success'})
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })

}

exports.removeFromCart = (req, res, next) => {

}