const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Baker = require('../model/baker');
const User = require('../model/user');
const Admin = require('../model/admin');
const Order = require('../model/order');
const { validationError, errorCode, clearImage, authenticationError } = require('../utils/utilities');

exports.register = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    bcrypt.hash(password, 12)
        .then(hashPw => {
            const admin = new Admin({
                name: name,
                email: email,
                password: hashPw
            })

            return admin.save();
        })
        .then(admin => {
            if(!admin) {
                const error = new Error('Admin not registered');
                error.statusCode = 422;
                throw error;
            }
            res.status(200)
                .json({
                    message: 'Successfully registered an admin',
                    admin: admin,
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.login = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const email = req.body.email;
    const password = req.body.password;
    let loadedAdmin;

    Admin.findOne({email})
        .then(admin => {
            if(!admin) {
                const error = new Error('Admin not registered');
                error.statusCode = 422;
                throw error;
            }
            loadedAdmin = admin;
            return bcrypt.compare(password, admin.password)
        })
        .then(isEqual => {
            if(!isEqual) {
                const error = new Error('Wrong credentials');
                error.statusCode = 422;
                throw error;
            }
            const token = jwt.sign({
                email:loadedAdmin.email,
                userId: loadedAdmin._id.toString(),
                name: loadedAdmin.name,
            }, 
                'somesupersecret',
                {expiresIn: '90d'}
            );
            res.status(200)
                .json({
                    token: token, 
                    user: loadedAdmin,
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.updateProfile = (req, res, next) => {
    validationError(req, 'An error occured', 422);
    const adminId = req.params.adminId;

    const { name, contact, email } = req.body;

    Admin.findById(adminId)
        .then(admin => {
            if (!admin) {
                authenticationError('Admin not found', 422);
            }
            admin.name = name || admin.name;
            admin.email = email || admin.email;
            admin.telNumber = contact || admin.telNumber;
            return admin.save();
        })
        .then(admin => {
            res.status(200)
                .json({ message: 'Successful', admin });
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
};

exports.changePasswordAdmin = (req, res, next) => {
    const adminId = req.params.adminId;

    const { oldPassword, newPassword } = req.body;

    Admin.findById(adminId)
        .then(admin => {
            bcrypt.compare(oldPassword, admin.password)
                .then(isEqual => {
                    if (!isEqual) {
                        authenticationError('Password mismatch', 422);
                    }
                    bcrypt.hash(newPassword, 12)
                        .then(hashedPassword => {
                            admin.password = hashedPassword;
                        })
                    return admin.save();
                })
                .then(result => {
                    res.status(200)
                        .json({ message: 'Success', admin: result });
                })
                .catch(err => {
                    errorCode(err, 500, next);
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        });
};


///////////////////////////////////////////
///                                    ///
///         Bakers controllers         ///
///                                    ///
//////////////////////////////////////////

exports.createBaker = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    if (!req.files) {
        const error = new Error('No valid Image');
        error.statusCode = 422;
        throw error;
    }

    const images = req.files;
    const name = req.body.name;
    const categories = req.body.categories;
    const companyName = req.body.companyName;
    const idCardNumber = req.body.idCardNumber;
    const password = req.body.password;

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const baker = new Baker({
                name: name, 
                categories: categories,
                companyName: companyName,
                idCardNumber: idCardNumber,
                ceoImage: images.bakerImage[0].path,
                companyImage: images.logo[0].path,
                password: hashedPassword,
            });
            return baker.save()
        })
        .then(result => {
            res.status(201).json({
            message: 'Posted successfully!',
            baker: result
            })
        })
        .catch(err =>{
            errorCode(err, 500, next);
        });
}

exports.getBakers = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 50;
    let totalItems;
    Baker.find()
        .sort({name: 'asc'})
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Baker.find() //put verify here by end of day
                .sort({companyName: 'asc'})
                .skip((currentPage - 1) * perPage)
                .limit(perPage)
        })
        .then(bakers => {
            res.status(200).json({message: "Fetched Bakers", bakers: bakers, totalItems: totalItems})
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.getAllBakers = (req, res, next) => {
    Baker.find()
        .then(bakers => {
            res.status(200).json({ message: "Fetched Bakers", bakers });
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
};

exports.getVerifiedBakers = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 50;
    let totalItems;
    Baker.find()
        .sort({name: 'asc'})
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Baker.find({verify: true}) //put verify here by end of day
                .sort({companyName: 'asc'})
                .skip((currentPage - 1) * perPage)
                .limit(perPage)
        })
        .then(bakers => {
            res.status(200).json({message: "Fetched Bakers", bakers: bakers, totalItems: totalItems})
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.changePasswordBaker = (req, res, next) => {
    const bakerId = req.params.bakerId;

    const { oldPassword, newPassword } = req.body;

    Baker.findById(bakerId)
        .then(baker => {
            bcrypt.compare(oldPassword, baker.password)
                .then(isEqual => {
                    if (!isEqual) {
                        authenticationError('Password mismatch', 422);
                    }
                    bcrypt.hash(newPassword, 12)
                        .then(hashedPassword => {
                            baker.password = hashedPassword;
                        })
                    return baker.save();
                })
                .then(result => {
                    res.status(200)
                        .json({ message: 'Success', baker: result });
                })
                .catch(err => {
                    errorCode(err, 500, next);
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        });
};


exports.getBaker = (req, res, next) => {
    const bakerId = req.params.bakerId;

    Baker.findById(bakerId)
        .then(baker => {
            if(!baker) {
                const error = new Error('Could not find Baker');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({message: 'Baker found', baker: baker});
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.suspendBaker = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const bakerId = req.params.bakerId;
    let suspend;

    Baker.findById(bakerId)
        .then(baker => {
            if(!baker) {
                const error = new Error('Baker not found');
                error.statusCode = 422;
                throw error;
            }
            baker.suspend = !baker.suspend;
            suspend = baker.suspend;
            return baker.save();
        })
        .then(result => {
            res.status(200)
                .json({
                    message: suspend ? 'Baker has been suspended' : 'Baker has been unsuspended',
                    baker: result,
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.verifyBaker = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const bakerId = req.params.bakerId;
    let verify;

    Baker.findById(bakerId)
        .then(baker => {
            if(!baker) {
                const error = new Error('Baker not found');
                error.statusCode = 422;
                throw error;
            }
            baker.verify = !baker.verify;
            verify = baker.verify;
            return baker.save();
        })
        .then(result => {
            res.status(200)
                .json({
                    message: verify ? 'Baker has been verified' : 'Baker has been unverified',
                    baker: result,
                })
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
            clearImage(baker.ceoImage);
            clearImage(baker.companyImage);
            return Baker.findByIdAndRemove(bakerId);
        })
        .then(result => {
            res.status(200).json({message: 'Successfully deleted baker'});
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}


///////////////////////////////////////////
///                                    ///
///         Users controllers          ///
///                                    ///
//////////////////////////////////////////

exports.getUsers = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 50;
    let totalItems;
    User.find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return User.find()
                .skip((currentPage - 1) * perPage)
                .limit(perPage)
        })
        .then(users => {
            res.status(200).json({message: "Fetched Bakers", users: users, totalItems: totalItems})
        })
        .catch(err => {
            errorCode(err, 500)
        })
}

exports.getAllUsers = (req, res, next) => {
    User.find()
        .then(users => {
            res.status(200).json({ message: "Fetched Bakers", users })
        })
        .catch(err => {
            errorCode(err, 500)
        })
}

exports.getUser = (req, res, next) => {
    const userId = req.params.userId;

    User.findById(userId)
        .then(user => {
            if(!user) {
                const error = new Error('Could not find User');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: 'User found', 
                user: user
            });
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.deleteUser = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const userId = req.params.userId;

    User.findById(userId)
        .then(user => {
            if (!user) {
                const error = new Error('User not found');
                error.statusCode = 422;
                throw error;
            }
            clearImage(user.image);
            return User.findByIdAndRemove(userId);
        })
        .then(result => {
            res.status(200)
                .json({
                    message: 'Successfully deleted user'
                });
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}


exports.suspendUser = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const userId = req.params.userId;

    User.findById(userId)
        .then(user => {
            if(!user) {
                const error = new Error('User not found');
                error.statusCode = 422;
                throw error;
            }
            user.suspend = !user.suspend;
            return user.save();
        })
        .then(result => {
            res.status(200)
                .json({
                    message: result.suspend ? 'User suspended' : 'User unsuspended',
                    user: result,
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.changePasswordUser = (req, res, next) => {
    const userId = req.params.userId;

    const { oldPassword, newPassword } = req.body;

    User.findById(userId)
        .then(user => {
            bcrypt.compare(oldPassword, user.password)
                .then(isEqual => {
                    if (!isEqual) {
                        authenticationError('Password mismatch', 422);
                    }
                    bcrypt.hash(newPassword, 12)
                        .then(hashedPassword => {
                            user.password = hashedPassword;
                        })
                    return user.save();
                })
                .then(result => {
                    res.status(200)
                        .json({ message: 'Success', user: result });
                })
                .catch(err => {
                    errorCode(err, 500, next);
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        });
};
