const {validationResult} = require('express');
const jwt = require('jsonwebtoken');

const Pastry = require('../model/pastry');
const {errorCode, clearImage, validationError, authenticationError} = require('../utils/utilities');

exports.getPastries = (req, res, next) => {
    validationError(req, 'An error occured', 422);
    const bakerId = req.params.bakerId;
    const currentPage = req.query.page || 1;
    const perPage = 50;
    let totalItems;

    Pastry.find({creatorId: bakerId})
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Pastry.find({creatorId: bakerId})
                .skip((currentPage - 1) * perPage)
                .limit(perPage)
        })
        .then(pastries => {
            res.status(200)
                .json({
                    message: 'Fetched Pastries', 
                    pastries: pastries, 
                    totalItems: totalItems
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.getSuperPastriesWeb = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const currentPage = req.query.page || 1;
    const perPage = 50;
    let totalItems;

    Pastry.find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Pastry.find()
                .populate('creatorId')
                .skip((currentPage - 1) * perPage)
                .limit(perPage)
        })
        .then(pastries => {
            res.status(200)
                .json({
                    message: 'Fetched Pastries', 
                    pastries: pastries, 
                    totalItems: totalItems
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.getSuperPastriesMob = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    Pastry.find()
        .populate('creatorId')
        .then(pastries => {
            // console.log(pastries)
            res.status(200)
                .json({
                    message: 'Fetched Pastries',
                    pastries: pastries,
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
};

exports.getPastry = (req, res, next) => {
    validationError(req, 'An Error occured', 422);

    const pastryId = req.params.pastryId;

    Pastry.findById(pastryId)
        .then(pastry => {
            if(!pastry) {
                const error = new Error('Could not find pastry')
                error.statusCode = 422;
                throw error;
            }
            res.status(200)
                .json({
                    message: 'Pastry found',
                    pastry: pastry
                })
        })
        .catch(err => {
            errorCode(err, 500);
        })
}

exports.createPastry = (req, res, next) => {
    validationError(req, 'An error occured', 422);
    
    if (!req.files.pastryImage) {
        authenticationError('No Pastry Image provided', 401);
    }
    
    let image = [];
    const {
        creatorId,
        name,
        type,
        discount,
        price,
        daysRequired,
        message,
        isAvailable,
        about,
        daysAvailable,
        recipe, } = req.body;

    if (req.files.pastryImage) {
        req.files.pastryImage.map((i, index) => image.push(i.path));
    }

    const pastry = new Pastry({
        name,
        price,
        description : about,
        discount,
        recipe,
        type,
        isAvailable,
        daysAvailable,
        message,
        daysRequired,
        image,
        creatorId,
    });
    pastry.save()
        .then(result => {
            console.log(result)
            res.status(201)
                .json({
                    message: 'Flavour added successfully',
                    pastry: result
                })
        })
        .catch(err => {
            console.log(err, 'hhh')
            errorCode(err, 500, next);
        })

}

exports.editPastry = (req, res, next) => {
    validationError(req, 'An Error occured', 422);

    const pastryId = req.params.pastryId;

    const {
        name,
        type,
        discount,
        price,
        daysRequired,
        message,
        isAvailable,
        about,
        daysAvailable,
        recipe,
        creatorId,
    } = req.body;

    let image = [];
    
    if (req.files.pastryImage) {
        req.files.pastryImage.map((i, index) => image.push(i.path));
    }

    Pastry.findById(pastryId)
        .then(pastry => {
            if (!pastry) {
                const error = new Error('Could not find pastry')
                error.statusCode = 422;
                throw error;
            }
            
            pastry.name = name;
            pastry.price = price;
            pastry.description = about;
            pastry.discount = discount;
            pastry.recipe = recipe;
            pastry.type = type;
            pastry.isAvailable = isAvailable;
            pastry.daysAvailable = daysAvailable.split(',');
            pastry.message = message;
            pastry.daysRequired = daysRequired;
            if (image && image.length >= 1) {
                let clear = pastry?.image.filter(x => !image.includes(x));
                clear.map((i) => clearImage(i));
                pastry.image = pastry.image.filter(item => clear.indexOf(item) < 0);
                pastry.image = image.concat(pastry?.image.filter((item) => image.indexOf(item) < 0));
                if (clear !== pastry?.image) {
                    pastry.image = pastry?.image.concat(clear).slice(0, 3)
                }
            }
            console.log(pastry);
            return pastry.save();
        })
        .then(result => {
            res.status(201)
                .json({
                    message: 'Successfully updated',
                    pastry: result
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
};

exports.editPastryImage = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const pastryId = req.params.pastryId;

    let pastryImage = req.body.pastryImage;

    const images = req.files;

    if(images) {
        pastryImage = images.pastryImage[0].path;
    }

    if (!pastryImage) {
        const error = new Error('Image missing');
        error.statusCode = 422;
        throw error;
    }

    Pastry.findById(pastryId)
        .then(pastry => {
            if(!pastry) {
                const error = new Error('Pastry not found.');
                error.statusCode = 422;
                throw error;
            }
            if (pastryImage !== pastry.image) {
                clearImage(pastry.image);
            }

            pastry.image = pastryImage;
            return pastry.save();
        })
        .then(result => {
            res.status(200)
                .json({
                    message: 'Image successfully updated',
                    pastry: result,
                })
        })
        .catch(err => {
            errorCode(err, 500);
        })
}

exports.deletePastry = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const pastryId = req.params.pastryId;

    Pastry.findById(pastryId)
        .then(pastry => {
            if (!pastry) {
                const error = new Error('Pastry not found');
                error.statusCode = 422;
                throw error;
            }
            pastry.image.map((i) => clearImage(i));
            return Pastry.findByIdAndRemove(pastryId);
        })
        .then(result => {
            res.status(200).json({message: 'Successfully deleted pastry'});
        })
        .catch(err => {
            errorCode(err, 500);
        })
}

exports.likePastry = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const pastryId = req.params.pastryId;
    const userId = req.query.user

    Pastry.findById(pastryId)
        .then(pastry => {
            return pastry.like(userId);
        })
        .then(result => {
            res.status(200).json({message: 'Liked pastry', response: result})
        })
        .catch(err => {
            res.status(500).json({message: 'Unsuccessful!'})
        })
}

exports.disLikePastry = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const pastryId = req.params.pastryId;
    const userId = req.query.user

    Pastry.findById(pastryId)
        .then(pastry => {
            return pastry.dislike(userId);
        })
        .then(result => {
            res.status(200).json({message: 'Dislked pastry', response: result})
        })
        .catch(err => {
            res.status(500).json({message: 'Unsuccessful!'})
        })
}