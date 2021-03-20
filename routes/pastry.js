const express = require('express');
const { body } = require("express-validator");

const pastryController = require('../controllers/pastry');
const router = express.Router();

router.get('/superpastries', pastryController.getSuperPastries);

router.get('/bakerpastries/:bakerId', pastryController.getPastries);

router.get('/pastries/:pastryId', pastryController.getPastry);

router.post('/create/pastry',  pastryController.createPastry);

router.put('/pastries/images/:pastryId', pastryController.editPastryImage);

router.put('/pastries/profile/:pastryId', pastryController.editPastry);

router.post('/pastry/like/:pastryId', pastryController.likePastry);

router.post('/pastry/dislike/:pastryId', pastryController.disLikePastry);

router.delete('/pastries/:pastryId', pastryController.deletePastry)

module.exports = router;