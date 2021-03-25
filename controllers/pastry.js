const {validationResult} = require('express');
const jwt = require('jsonwebtoken');

const Pastry = require('../model/pastry');
const {errorCode, clearImage, validationError, authenticationError} = require('../utils/utilities');

exports.getPastries = (req, res, next) => {
    validationError(req, 'An error occured', 422);
    const bakerId = req.params.bakerId;
    const currentPage = req.query.page || 1;
    const perPage = 18;
    let totalItems;

    Pastry.find({creator: bakerId})
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Pastry.find({creator: bakerId})
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

exports.getSuperPastries = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const currentPage = req.query.page || 1;
    const perPage = 18;
    let totalItems;

    Pastry.find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Pastry.find()
                .populate('creator')
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
    
    let image;
    const name = req.body.name;
    const discount = req.body.discount;
    const price = req.body.price;
    const description = req.body.about;
    const type = req.body.type;
    const creator = req.body.bakerId;

    if (req.files.pastryImage) {
        image = req.files.pastryImage[0].path;
    }

    const pastry = new Pastry({
        name,
        price,
        description,
        image,
        type,
        discount,
        creator,
    });

    pastry.save()
        .then(result => {
            res.status(201)
                .json({
                    message: 'Baked successfully',
                    pastry: result
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })

}

exports.editPastry = (req, res, next) => {
    validationError(req, 'An Error occured', 422);

    const pastryId = req.params.pastryId;

    const name = req.body.name;
    const price = req.body.price;
    const description = req.body.description;
    const discount = req.body.discount;
    const recipe = req.body.recipe;

    Pastry.findById(pastryId)
        .then(pastry => {
          if(!pastry) {
                const error = new Error('Could not find pastry')
                error.statusCode = 422;
                throw error;
            }
            pastry.name = name;
            pastry.price = price;
            pastry.description = description;  
            pastry.discount = discount;
            pastry.recipe = recipe;
            return pastry.save();
        })
        .then(result => {
            res.status(200)
                .json({
                    message: 'Successfully updated',
                    pastry: result
                })
        })
        .catch(err => {
            errorCode(err, 500);
        })
}

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
            return baker.save();
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
            clearImage(pastry.image);
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