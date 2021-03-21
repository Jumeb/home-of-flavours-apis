const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Baker = require('../model/baker');
const Order = require('../model/order');
const {errorCode, clearImage, validationError} = require('../utils/utilities');

exports.register = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const name = req.body.name;
    const email = req.body.email;
    const categories = req.body.categories;
    const companyName = req.body.companyName;
    const idCardNumber = req.body.idCard;
    const password = req.body.password;
    const telNumber = req.body.tel;

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const baker = new Baker({
                name, 
                categories,
                companyName,
                idCardNumber,
                password: hashedPassword,
                telNumber,
                email,
            });
            return baker.save()
        })
        .then(result => {
            res.status(201).json({
            message: 'Registration successfully!',
            baker: result
            })
        })
        .catch(err =>{
            errorCode(err, 500, next);
        });
}

exports.login = (req, res, next) => {
    const idCardNumber = req.body.email;
    const password = req.body.password;
    let loadedUser;

    Baker.findOne({idCardNumber: idCardNumber})
        .then(baker => {
            if(!baker) {
                const error = new Error('User not found.');
                error.statusCode = 401;
                throw error;
            }
            loadedUser = baker;
            return bcrypt.compare(password, baker.password);
        })
        .then(isEqual => {
            if(!isEqual) {
                const error = new Error('Wrong credentials');
                error.statusCode = 401;
                throw error;
            }

            if (!loadedUser.verify) {
                const error = new Error(`Mr/Miss, ${loadedUser.name}, your account is yet to be verified. Please reconvene in 4 working days.`);
                error.statusCode = 401;
                throw error;
            }

            if (loadedUser.suspend) {
                const error = new Error(`Mr/Miss, ${loadedUser.name}, your account has been suspended. Please contact our support team.`);
                error.statusCode = 402;
                throw error;
            }

            const token = jwt.sign({
                    email: loadedUser.email,
                    userId: loadedUser._id.toString(),
                    type: loadedUser.type,
                },
                    'somesupersecret',
                    {expiresIn: '90d'}
            );
            res.status(200)
                .json({
                    token: token, 
                    user: loadedUser
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.editBaker = (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }

    const bakerId = req.params.bakerId;

    const name = req.body.name;
    const companyName = req.body.companyName;
    const categories = req.body.categories;
    const idCardNumber = req.body.idCardNumber;
    const about = req.body.about;
    const momoNumber = req.body.momoNumber;
    const telNumber = req.body.telNumber;

    Baker.findById(bakerId)
        .then(baker =>{
            if(!baker) {
                const error = new Error('Could not find Baker');
                error.statusCode = 404;
                throw error;
            }

            baker.name = name;
            baker.categories = categories;
            baker.idCardNumber = idCardNumber;
            baker.about = about;
            baker.telNumber = telNumber;
            baker.companyName = companyName;
            baker.momoNumber = momoNumber;

            return baker.save();
        })
        .then(result => {
            res.status(200).json({message:'Successfully updated profile', baker: result});
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.editBakerImages = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }

    const bakerId = req.params.bakerId;

    //You can parse the image as text in hidden inputs
    let bakerImage = req.body.bakerImage;
    let logo = req.body.logo;

    const images = req.files;

    if (images) {
        logo = images.logo[0].path;
        bakerImage = images.bakerImage[0].path;
    }

    if (!logo || !bakerImage) {
        const error = new Error('Image missing');
        error.statusCode = 422;
        throw error;
    }

    Baker.findById(bakerId)
        .then(baker => {
            if (!baker) {
                const error = new Error('Baker not found');
                error.statusCode = 422;
                throw error;
            }
            if (logo !== baker.company_image) {
                clearImage(baker.company_image);
            }

            if (bakerImage !== baker.ceo_image) {
                clearImage(baker.ceo_image);
            }
            baker.company_image = logo;
            baker.ceo_image = bakerImage;
            return baker.save();
        })
        .then(result => {
            res.status(200).json({message: 'Image successfullly updated', baker: result})
        })
        .catch(err => {
            errorCode(err, 500, next);
        })

}

exports.deleteBaker = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }

    const bakerId = req.params.bakerId;

    Baker.findById(bakerId)
        .then(baker => {
            if (!baker) {
                const error = new Error('Baker not found');
                error.statusCode = 422;
                throw error;
            }
            clearImage(baker.ceo_image);
            clearImage(baker.company_image);
            return Baker.findByIdAndRemove(bakerId);
        })
        .then(result => {
            res.status(200).json({message: 'Successfully deleted baker'});
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.orderStatus = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const orderId = req.param.orderId;

    const orderStatus = req.body.orderStatus;

    Order.findById(orderId)
        .then(order => {
            if(!order) {
                const error = new Error("Order not found");
                error.statusCode = 422;
                throw error;
            }
            order.status = orderStatus;
            return order.save();
        })
        .then(result => {
            res.status(200)
                .json({
                    message: 'Order status successfully changed',
                    order: result,
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}
