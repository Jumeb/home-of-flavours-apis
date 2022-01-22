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

// let transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.PASSWORD
//     }
// });

// CLIENT_ID="726092047273-qsfsckg63kss1g920f4mfr0f90i27fni.apps.googleusercontent.com"
// CLIENT_SECRET="MNCuPuE6dv7qrwia1Uz1694M"
// GMAIL_USERNAME="bnyuykonghi@gmail.com"
// REFRESH_TOKEN="1//04hG7k4zRUF3lCgYIARAAGAQSNwF-L9IrxBBrLinpCrGTkAmXwIaBEJCQidm19KpvkYVi0S6bxyH6djeicKYRi-8gWv0w8fX706g"
// ACCESS_TOKEN="ya29.a0AfH6SMD2IwsWCW1KCrx8r0jgavc2jM6Ti3vm_Uqqh3zka-JeMp2JS-vmsM7UxxPG0udCDdn-tVmv2EG53P_u-J7F7cshVKjEjNa8Qo5Cahlp_BhBe_F2-0GAThCo_2a2ry20inrRXz1D2xQJu60Wgr0fDSHg"

// let transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         type: "OAUTH2",
//         user: GMAIL_USERNAME,  //set these in your .env file
//         clientId: CLIENT_ID,
//         clientSecret: CLIENT_SECRET,
//         refreshToken: REFRESH_TOKEN,
//         // user: process.env.EMAIL,
//         // pass: process.env.PASSWORD
//     }
// });

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
const Location = require('../model/location');
const { validationError, errorCode, clearImage, authenticationError } = require('../utils/utilities');

exports.register = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const { name, email, password } = req.body;

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

    const { email, password } = req.body;
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

exports.editImage = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const adminId = req.params.adminId;

    let image;

    if (req.files.image) {
        image = req.files.image[0].path;
    }

    Admin.findById(adminId)
        .then(admin => {
            if (!admin) {
                authenticationError('Admin not found', 422);
            }
            if (image !== admin.image) {
                clearImage(admin.image);
            }
            admin.image = image || admin.image;
            return admin.save();
        })
        .then(admin => {
            res.status(200)
                .json({ message: 'Image successfully updated', admin });
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
                        authenticationError('Password mismatch', 422);
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

exports.getVerifiedBakersWeb = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 50;
    let totalItems;
    Baker.find()
        .sort({total: 'desc'})
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Baker.find({verify: true}) //put verify here by end of day
                // .sort({total: 'desc'})
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
                        authenticationError('Password mismatch', 422);
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
            transporter.sendMail({
                from: '"Jume Brice 👻" <bnyuykonghi@gmail.com>', // sender address
                to: baker.email, // list of receivers
                subject: baker.suspend ? "Suspended" : 'Restored',
                text: baker.suspend ? "You account has been suspended" : "You account has been restored" ,
                template: baker.suspend ? 'suspend' : 'unsuspend',
                context: {
                    name: baker.name,
                    companyName: baker.companyName,
                }
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
    console.log(process.env.GMAIL_USERNAME)

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
            transporter.sendMail({
                from: '"Jume Brice 👻" <bnyuykonghi@gmail.com>', // sender address
                to: baker.email, // list of receivers
                subject: "Verified account",
                text: "You account has been verified" ,
                template: 'welcome',
                context: {
                    name: baker.name,
                    companyName: baker.companyName,
                }
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
console.log(process.env.GMAIL_USERNAME, process.env.REFRESH_TOKEN)
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
            return transporter.sendMail({
                from: '"Jume Brice 👻" <bnyuykonghi@gmail.com>',
                to: user.email, 
                subject: user.suspend ? "Suspended" : 'Restored',
                text: user.suspend ? "You account has been suspended" : "You account has been restored" ,
                template: user.suspend ? 'suspendUser' : 'unsuspendUser',
                context: {
                    name: user.name,
                }
            })
        })
        .catch(err => {
            console.log(err)
            // errorCode(err, 500, next);
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
    console.log(locate)

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