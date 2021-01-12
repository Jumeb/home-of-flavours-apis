const express = require('express');
const {body} = require('express-validator');

const router = express.Router();

const isAuth = require('../middleware/isAuth');
const eventController = require('../controllers/event');

router.get('/events', isAuth, eventController.getEvents);

router.get('/events/:eventId', isAuth, eventController);

router.post('/create/event', isAuth, eventController);

router.put('/events/profile/:eventId', isAuth, eventController);

router.put('/events/images/:eventId', isAuth, eventController)

router.delete('/events/:eventId', isAuth, eventController);

module.exports = router;