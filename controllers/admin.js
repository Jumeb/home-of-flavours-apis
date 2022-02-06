const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const hbs = require('nodemailer-express-handlebars');

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
const User = require('../model/user');
const Admin = require('../model/admin');
const Order = require('../model/order');
const Pastry = require('../model/pastry');
const Location = require('../model/location');
const Transactions = require('../model/transactions');
const Wallet = require('../model/wallet');
const { validationError, errorCode, clearImage, authenticationError } = require('../utils/utilities');
const transactions = require('../model/transactions');

exports.register = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const { name, tel, email, companyName, type, about, momoName, momoNumber, password } = req.body;

    bcrypt.hash(password, 12)
        .then(hashPw => {
            const admin = new Admin({
                name,
                email,
                telNumber: tel,
                companyName,
                type,
                about,
                momoName,
                momoNumber,
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
                    admin,
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.login = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const { email, password } = req.body;
    let loadedAdmin;

    Admin.findOne({ email })
        .then(admin => {
            if (!admin) {
                const error = new Error('User not found.');
                error.statusCode = 422;
                throw error;
            }
            loadedAdmin = admin;
            return bcrypt.compare(password, admin.password)
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong credentials');
                error.statusCode = 422;
                throw error;
            }
            const token = jwt.sign({
                email: loadedAdmin.email,
                userId: loadedAdmin._id.toString(),
                name: loadedAdmin.name,
            },
                'somesupersecret',
                { expiresIn: '90d' }
            );
            res.status(200)
                .json({
                    token: token,
                    user: loadedAdmin,
                })
        })
        .catch(err => {
            // console.log(err)
            errorCode(err, 500, next);
        })
};

exports.updateProfile = (req, res, next) => {
    validationError(req, 'An error occured', 422);
    const adminId = req.params.adminId;

    const { name, tel, email, companyName, type, about, momoName, momoNumber } = req.body;
    Admin.findById(adminId)
        .then(admin => {
            if (!admin) {
                authenticationError('Admin not found', 422);
            }
            admin.name = name || admin.name;
            admin.email = email || admin.email;
            admin.telNumber = tel || admin.telNumber;
            admin.companyName = companyName || admin.companyName;
            admin.type = type || admin.type;
            admin.about = about || admin.about;
            admin.momoNumber = momoNumber || admin.momoNumber;
            admin.momoName = momoName || admin.momoName;
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

exports.editImage = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const adminId = req.params.adminId;

    let image = [];

    if (req.files.image) {
        req.files.image.map((i, index) => image.push(i.path));
    }

    Admin.findById(adminId)
        .then(admin => {
            if (!admin) {
                authenticationError('Admin not found', 422);
            }
            if (image && image.length >= 1) {
                let clear = admin?.image.filter(x => !image.includes(x));
                clear.map((i) => clearImage(i));
                admin.image = admin.image.filter(item => clear.indexOf(item) < 0);
                admin.image = image.concat(admin?.image.filter((item) => image.indexOf(item) < 0));
                if (clear !== admin?.image) {
                    admin.image = admin?.image.concat(clear).slice(0, 3)
                }
            }
            return admin.save();
        })
        .then(admin => {
            res.status(200)
                .json({ message: 'Image successfully updated', user: admin });
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
};

exports.getAdmins = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    Admin.find()
        .then(admins => {
        if (!admins) {
                authenticationError('Admin not found', 422);
        }
            res.status(200).json({message: 'Partners fetched', partners: admins})
        })
        .catch(err => {
            errorCode(err, 500, next);
    })

}

exports.deleteAdmin = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }

    const adminId = req.params.adminId;

    Admin.findById(adminId)
        .then(admin => {
            if (!admin) {
                const error = new Error('Baker not found');
                error.statusCode = 422;
                throw error;
            }
            admin.image.map((i) => clearImage(i));
            return Admin.findByIdAndRemove(adminId);
        })
        .then(result => {
            res.status(200).json({ message: 'Successfully deleted Admin' });
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.changePasswordAdmin = (req, res, next) => {
    const adminId = req.params.adminId;

    const { oldPassword, newPassword } = req.body;

    Admin.findById(adminId)
        .then(admin => {
            bcrypt.compare(oldPassword, admin.password)
                .then(isEqual => {
                    if (!isEqual) {
                        authenticationError('Old Password mismatch', 422);
                    }
                    bcrypt.hash(newPassword, 12)
                        .then(hashedPassword => {
                            admin.password = hashedPassword;
                            admin.save();
                        })
                    return admin;
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
    Baker.find()
        .then(bakers => {
            res.status(200).json({message: "Fetched Bakers", bakers: bakers})
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

exports.getVerifiedBakersWeb = (req, res, next) => {
    Baker.find()
        .then(bakers => {
            res.status(200).json({message: "Fetched Bakers", bakers: bakers})
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.getVerifiedBakersMob = (req, res, next) => {
    Baker.find({verify: true})
        .sort({total: 'desc'})
        .then(bakers => {
            res.status(200).json({message: "Fetched Bakers", bakers: bakers})
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
                        authenticationError('Old Password mismatch', 422);
                    }
                    bcrypt.hash(newPassword, 12)
                        .then(hashedPassword => {
                            baker.password = hashedPassword;
                            baker.save();
                        })
                    return baker;
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

            return result;
        })
        .then(baker => {
            // transporter.sendMail({
            //     from: '"Jume Brice 👻" <bnyuykonghi@gmail.com>', // sender address
            //     to: baker.email, // list of receivers
            //     subject: baker.suspend ? "Suspended" : 'Restored',
            //     text: baker.suspend ? "You account has been suspended" : "You account has been restored" ,
            //     template: baker.suspend ? 'suspend' : 'unsuspend',
            //     context: {
            //         name: baker.name,
            //         companyName: baker.companyName,
            //     }
            // })
        })
        .catch(err => {
            // console.log(err);
            errorCode(err, 500, next);
        })
}

exports.verifyBaker = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const bakerId = req.params.bakerId;
    let verify;
    // console.log(process.env.GMAIL_USERNAME);

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
            return result;
        })
        .then(baker => {
            // transporter.sendMail({
            //     from: '"Jume Brice 👻" <bnyuykonghi@gmail.com>', // sender address
            //     to: baker.email, // list of receivers
            //     subject: "Verified account",
            //     text: "You account has been verified" ,
            //     template: 'welcome',
            //     context: {
            //         name: baker.name,
            //         companyName: baker.companyName,
            //     }
            // })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.deleteBaker = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
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
            baker.ceoImage.map((i) => clearImage(i));
            clearImage(baker.companyImage);
            return Baker.findByIdAndRemove(bakerId);
        })
        .then(result => {
            res.status(200).json({ message: 'Successfully deleted baker' });
        })
        .then(result => {
            Wallet.find({ creatorId: bakerId })
                .then(wallet => {
                    if (!wallet) {
                        const error = new Error('Baker not found');
                        error.statusCode = 422;
                        throw error;
                    }
                    return Wallet.findByIdAndRemove(wallet[0]._id);
                })
            Pastry.find({ creatorId: bakerId })
                .then(pastries => {
                    if (!pastries) {
                        const error = new Error('No pastries found');
                        error.statusCode = 422;
                        throw error;
                    }
                    let ids = [];
                    pastries.map((pastry) => {
                        pastry.image.map((i) => clearImage(i));
                        ids.push(pastry._id);
                        Pastry.findByIdAndRemove(pastry._id)
                    });
                    ids.map((i) => { Pastry.findByIdAndRemove(i) });
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
};


///////////////////////////////////////////
///                                    ///
///         Users controllers          ///
///                                    ///
//////////////////////////////////////////

exports.getUsers = (req, res, next) => {
    User.find()
        .then(users => {
            res.status(200).json({message: "Fetched Bakers", users: users})
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
            // console.log(user)
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
            return result;
        })
        .then(user => {
            // return transporter.sendMail({
            //     from: '"Jume Brice 👻" <bnyuykonghi@gmail.com>',
            //     to: user.email, 
            //     subject: user.suspend ? "Suspended" : 'Restored',
            //     text: user.suspend ? "You account has been suspended" : "You account has been restored" ,
            //     template: user.suspend ? 'suspendUser' : 'unsuspendUser',
            //     context: {
            //         name: user.name,
            //     }
            // })
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
                        authenticationError('Old Password mismatch.', 422);
                    }
                    bcrypt.hash(newPassword, 12)
                        .then(hashedPassword => {
                            user.password = hashedPassword;
                            user.save();
                        })
                    return user;
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


///////////////////////////////////////////
///                                    ///
///         Location controllers       ///
///                                    ///
//////////////////////////////////////////

exports.postLocation = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const adminId = req.params.adminId;

    const { location, coords, region, deliveryFee, locationOwner, country, town } = req.body;

    const locate = new Location({
        country,
        region, 
        town,
        location,
        coords,
        deliveryFee,
        locationOwner,
        creatorId: adminId,
    });

    locate.save()
        .then(location => {
            res.status(200)
                .json({
                    message: "Success",
                    location,
            })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })

}

exports.getLocations = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    Location.find()
        .then(locations => {
            if (!locations) {
                authenticationError('Locations not found', 422);
            }
            res.status(200)
                .json({
                    message: 'Success',
                    locations,
            })
        })
        .catch(err => {
            errorCode(err, 500, next);
    })
}

exports.editLocation = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const { locationId } = req.params;

    const { location, coords, region, deliveryFee, locationOwner, country, town } = req.body;

    Location.findById(locationId)
        .then(locate => {
            if (!locate) {
                authenticationError('Location not found', 422);
            }
            locate.country = country || locate.country;
            locate.region = region || locate.region;
            locate.town = town || locate.town;
            locate.location = location || locate.location;
            locate.coords = coords || locate.coords;
            locate.deliveryFee = deliveryFee || locate.deliveryFee;
            locate.locationOwner = locationOwner || locate.locationOwner;
            return locate.save();
        })
        .then(locate => {
            res.status(201).json({
                message: 'Success',
                location: locate,
        })
        })
        .catch(err => {
            errorCode(err, 500, next);
    })
}

exports.deletLocation = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const { locationId } = req.params;

    Location.findByIdAndRemove(locationId)
        .then(result => {
            if (!result) {
                authenticationError('Result not found', 422);
            }
            res.status(201)
                .json({
                    message: 'Deleted Successfully.',
                    result
                });
        })
        .catch(err => {
            errorCode(err, 500, next);
    })
}

///////////////////////////////////////////
///                                    ///
///     Transactions controllers       ///
///                                    ///
//////////////////////////////////////////

exports.getMyTransactions = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const userId = req.params.userId;

    Transactions.find({from: userId} || {to: userId})
        .then(transactions => {
            res.status(200)
                .json({
                    message: 'Success',
                    transactions,
            })
        })
        .catch(err => {
            errorCode(err, 500, next);
    })
}

exports.transferAC = (req, res, next) => {

    const { email, amount } = req.body;
    const { userId } = req.params;

    let userWallet;
    let AdminWallet;
    let _wallets;

    Wallet.find()
        .then(wallets => {
            if (!wallets) {
                authenticationError(req, 'Wallets not found', 401);
            }
            _wallets = wallets;
            userWallet = wallets.filter(wallet => wallet.creatorId.toString() === userId.toString())[0];
            AdminWallet = wallets.filter(wallet => wallet.walletOwner.toString() === 'Admin')[0];
        })
        .catch(err => {
            errorCode(err, 500, next);
        });
    

    User.find({ email: email })
        .then(user => {
            receiverWallet = _wallets.filter(wallet => wallet.creatorId.toString() === user[0]._id.toString())[0];
            if (userWallet.amount < Number(Number(amount) + (Number(amount) * 0.05))) {
                return res.status(404).json({ message: 'Aroma coins insufficient.' });
            }
            let transaction;
            receiverWallet.amount = Number(receiverWallet.amount) + Number(amount);
            userWallet.amount = Number(userWallet.amount) - (Number(amount) + (Number(amount) * 0.05));
            AdminWallet.amount = Number(AdminWallet.amount) + (Number(amount) * 0.05);
            userWallet.save();
            receiverWallet.save();
            AdminWallet.save();
            transaction = new Transactions({
                amount: Number(amount),
                reason: 'Transfer',
                from: userId,
                to: user._id,
                walletSender: 'User',
                walletReceiver: 'User',
            });
            transaction.save();
            transaction = new Transactions({
                amount: Number(amount) * 0.05,
                reason: 'Transfer Fee',
                from: userId,
                to: AdminWallet.creatorId,
                walletSender: 'User',
                walletReceiver: 'Admin',
            });
            transaction.save();
            return res.status(200).json({ message: 'Transfer Successful' });
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
};