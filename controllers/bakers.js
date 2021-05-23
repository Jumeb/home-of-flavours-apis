const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const hbs = require('nodemailer-express-handlebars');

CLIENT_ID="726092047273-qsfsckg63kss1g920f4mfr0f90i27fni.apps.googleusercontent.com"
CLIENT_SECRET="MNCuPuE6dv7qrwia1Uz1694M"
GMAIL_USERNAME="bricejume@gmail.com"
REFRESH_TOKEN="1//04hG7k4zRUF3lCgYIARAAGAQSNwF-L9IrxBBrLinpCrGTkAmXwIaBEJCQidm19KpvkYVi0S6bxyH6djeicKYRi-8gWv0w8fX706g"
ACCESS_TOKEN="ya29.a0AfH6SMD2IwsWCW1KCrx8r0jgavc2jM6Ti3vm_Uqqh3zka-JeMp2JS-vmsM7UxxPG0udCDdn-tVmv2EG53P_u-J7F7cshVKjEjNa8Qo5Cahlp_BhBe_F2-0GAThCo_2a2ry20inrRXz1D2xQJu60Wgr0fDSHg"

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: "OAUTH2",
        user: process.env.GMAIL_USERNAME,  //set these in your .env file
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        // user: process.env.EMAIL,
        // pass: process.env.PASSWORD
    }
});

transporter.use('compile', hbs({
    viewEngine: {
        extname: '.handlebars',
        layoutsDir: './views/',
        defaultLayout : 'index',
    },
    viewPath: './views/'
}));

const Baker = require('../model/baker');
const Order = require('../model/order');
const {errorCode, clearImage, validationError, authenticationError} = require('../utils/utilities');

exports.register = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const name = req.body.name;
    const email = req.body.email;
    const categories = req.body.categories;
    const companyName = req.body.companyName;
    const idCardNumber = req.body.idCard;
    const password = req.body.password;
    const telNumber = req.body.tel;

    console.log(email, name, process.env.GMAIL_USERNAME);

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
            console.log('email sending');
            return transporter.sendMail({
                from: '"Jume Brice 👻" <bricejume@gmail.com>',
                to: email,
                subject: "Welcome to Home of Flavours",
                text: "You have successfully signed up in HOF", 
                template: 'register',
                context: {
                    name: name,
                    companyName
                }
            }).then(power => {
                console.log(power, 'email sent');
                res.status(201).json({
                    message: 'Registration successfully!',
                    baker: result
                })
            })
                .catch(err => {
                    errorCode(err, 500, next);
                
                });
        })
        .catch(err => {
            errorCode(err, 500, next);
        });
};

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
    const company = req.body.company;
    const categories = req.body.categories;
    const about = req.body.about;
    const momo = req.body.momo;
    const contact = req.body.contact;
    const email = req.body.email;
    const momoName = req.body.momoName;
    const location = req.body.location;

    Baker.findById(bakerId)
        .then(baker =>{
            if(!baker) {
                const error = new Error('Could not find Baker');
                error.statusCode = 404;
                throw error;
            }

            baker.name = name || baker.name;
            baker.categories = categories.length >= 1 ? categories : baker.categories;
            baker.about = about || baker.about;
            baker.telNumber = contact || baker.telNumber;
            baker.companyName = company || baker.companyName;
            baker.momoNumber = momo || baker.momoNumber;
            baker.momoName = momoName || baker.momoName;
            baker.location = location || baker.location;
            baker.email = email || baker.email;

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

    let ceoImage;
    let companyImage;

    if (req.files.logo) {
        companyImage = req.files.logo[0].path;
    }

    if (req.files.image) {
        ceoImage = req.files.image[0].path;
    }

    Baker.findById(bakerId)
        .then(baker => {
            if (!baker) {
                const error = new Error('Baker not found');
                error.statusCode = 422;
                throw error;
            }
            if (companyImage !== baker.companyImage) {
                clearImage(baker.companyImage);
            }

            if (ceoImage !== baker.ceoImage) {
                clearImage(baker.ceoImage);
            }
            baker.companyImage = companyImage || baker.companyImage;
            baker.ceoImage = ceoImage || baker.ceoImage;
            return baker.save();
        })
        .then(result => {
            res.status(200).json({message: 'Image successfully updated', baker: result})
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

exports.likeBaker = (req, res, next) => {
    validationError(req, 'An error has occured', 422);

    const bakerId = req.params.bakerId;
    const userId = req.query.user;

    Baker.findById(bakerId)
        .then(baker => {
            if (!baker) {
                authenticationError('Baker was not found', 401);
            }
            return baker.like(userId);
        })
        .then(result => {
            res.status(200).json({ message: 'Succes', baker: result });
        })
        .catch(err => {
            errorCode(err, 500, next);
    })
}

exports.dislikeBaker = (req, res, next) => {
    validationError(req, 'An error occured', 442);

    const bakerId = req.params.bakerId;
    const userId = req.query.user;

    Baker.findById(bakerId)
        .then(baker => {
            if (!baker) {
                authenticationError('Baker was not found', 401);
            }
            return baker.dislike(userId);
        })
        .then(result => {
            res.status(200).json({ message: 'Succes', baker: result });
        })
        .catch(err => {
            errorCode(err, 500, next);
    })
}

exports.followBaker = (req, res, next) => {
    validationError(req, 'An error occured', 442);

    const bakerId = req.params.bakerId;
    const userId = req.query.user;

    Baker.findById(bakerId)
        .then(baker => {
            if (!baker) {
                authenticationError('Baker was not found', 401);
            }
            return baker.follow(userId);
        })
        .then(result => {
            res.status(200).json({ message: 'Succes', baker: result });
        })
        .catch(err => {
            errorCode(err, 500, next);
    })
}