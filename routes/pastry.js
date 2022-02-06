const express = require('express');
const { body } = require("express-validator");

const pastryController = require('../controllers/pastry');
const router = express.Router();

router.get('/superpastries', pastryController.getSuperPastriesWeb);

router.get('/superpastriesmob', pastryController.getSuperPastriesMob);

router.get('/bakerpastries/:bakerId', pastryController.getPastries);

router.get('/pastries/:pastryId', pastryController.getPastry);

router.post('/pastry/create',  pastryController.createPastry);

router.put('/pastries/images/:pastryId', pastryController.editPastryImage);

router.put('/pastry/edit/:pastryId', pastryController.editPastry);

router.post('/pastry/like/:pastryId', pastryController.likePastry);

router.post('/pastry/dislike/:pastryId', pastryController.disLikePastry);

router.delete('/pastry/delete/:pastryId', pastryController.deletePastry);

router.delete('/pastry/delete/admin/:pastryId', pastryController.deletePastryAdmin);

module.exports = router;