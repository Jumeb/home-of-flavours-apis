const {validationResult} = require('express');
const jwt = require('jsonwebtoken');

const Pastry = require('../model/pastry');
const {errorCode, clearImage, validationError} = require('../utils/utilities');

exports.getPastries = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const currentPage = req.query.page || 1;
    const perPage = 18;
    let totalItems;

    Pastry.find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Pastry.find()
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
            errorCode(err, 500);
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

    if (!req.files) {
        const error = new Error('No valid files found');
        error.statusCode = 422;
        throw error;
    }

    const name = req.body.name;
    const price = req.body.price;
    const description = req.body.description;
    const images = req.files;

    console.log(images.pastryImage);

    const pastry = new Pastry({
        name: name,
        price: price,
        description: description,
        image: images.pastryImage[0].path,
        creator: req.userId,
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
            errorCode(err, 500);
        })

}

exports.editProfile = (req, res, next) => {
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

exports.editImages = (req, res, next) => {
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