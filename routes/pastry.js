const express = require('express');
const { body } = require("express-validator");

const pastryController = require('../controllers/pastry');
const router = express.Router();

router.get('/pastries', pastryController.getPastries);

router.get('/pastries/:pastryId', pastryController.getPastry);

router.post('/create/pastry',  pastryController.createPastry);

router.put('/pastries/images/:pastryId', pastryController.editImages);

router.put('/pastries/profile/:pastryId', pastryController.editProfile);

router.delete('/pastries/:pastryId', pastryController.deletePastry)

module.exports = router;