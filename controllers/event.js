const {validationResult} = require('express-validator');

const {errorCode, validationError, clearImage} = require('../utils/utilities');
const Event = require('../model/event');
const User = require('../model/user');
const pastry = require('../model/pastry');

exports.getEvents = (req, res, next) => {
    validationError(req, 'An error occured', 422);
    const currentPage = req.query.page || 1;
    const perPage = 18;
    let totalItems;

    Event.find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Event.find()
                .skip((currentPage - 1) * perPage)
                .limit(perPage)
        })
        .then(events => {
            res.status(200)
                .json({
                    message: 'Fetched events',
                    events: events,
                    totalItems: totalItems
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.getEvent = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const eventId = req.params.eventId;

    Event.findById(eventId)
        .then(event => {
            if(!event) {
                const error = new Error('Could not find event');
                error.statusCode = 422;
                throw error;
            }
            res.status(200)
                .json({
                    message: 'Fetched event',
                    event: event,
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.createEvent = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const name = req.body.name;
    const purpose = req.body.purpose;
    const date = req.body.date;
    const images = req.files;

    let creator;

    if (!images) {
        const error = new Error('Please select an image');
        error.statusCode = 422;
        throw error;
    }

    const event = new Event({
        name: name,
        purpose: purpose,
        date: date,
        image: images.userImage[0].path,
        creatorId: req.userId,
    })

    event.save()
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            creator = user;
            user.events.push(events);
            return user.save()
        })
        .then(result => {
            res.status(201)
                .json({
                    message: 'Event added successfully',
                    event: event,
                    creator: {id: creator._id, name: creator.name}
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.editProfile = (req, res, next) => {
    validationError(req, 'An error occured', 422);
    
    const eventId = req.params.eventId;

    const name = req.body.name;
    const purpose = req.body.purpose;
    const data = req.body.date;

    Event.findById(eventId)
        .then(event => {
            if(!event) {
                const error = new Error('Event not found');
                error.statusCode = 422;
                throw error;
            }
            if(event.creatorId !== req.userId) {
                const error = new Error("Not authorised to edit this event");
                error.statusCode = 403;
                throw error;
            }
            event.name = name;
            event.purpose = purpose;
            event.date = date;
            return event.save();
        })
        .then(result => {
            res.status(200)
                .json({
                    message: 'Event profile updated',
                    event: result,
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}

exports.editImages = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const eventId = req.params.eventId;

    const eventImage = req.body.image;
    const images = req.files;


    if(!images) {
        const error = new Error('No image found');
        error.statusCode = 422;
        throw error;
    }

    if(!image) {
        const error = new Error('No image found');
        error.statusCode = 422;
        throw error;
    }

    Event.findById(eventId)
        .then(event => {
            if(!event) {
                const error = new Error('Event not found');
                error.statusCode = 422;
                throw error;
            }
            if(eventImage !== event.image){
                clearImage(event.image);
            }
            event.image = eventImage;
            return event.save()
        })
        .then(result => {
            res.status(201)
                .json({
                    message: 'Image updated successfully',
                    event: result,
                })
        })
        .catch(err => {
            errorCode(err, 422);
        })

}

exports.deleteEvent = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const eventId = req.body.eventId;

    Event.findById(eventId)
        .then(event => {
            if(!event) {
                const error = new Error('Event not found');
                error.statusCode = 422;
                throw error;
            }

            if (event.image) {
                clearImage(event.image);
            }
            return Event.findByIdAndRemove(eventId);
        })
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user => {
            user.events.pull(eventId);
            return user.save();
        })
        .then(result => {
            res.status(200)
                .json({
                    message: 'Event deleted successfully',
                })
        })
        .catch(err => {
            errorCode(err, 500, next);
        })
}