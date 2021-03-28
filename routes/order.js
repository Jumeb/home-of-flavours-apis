const express = require('express');
const {body} = require('express-validator');

const router = express.Router();

const orderController = require('../controllers/order');
const isAuth = require('../middleware/isAuth');

router.get('/user/getorders/:userId', orderController.getMyOrders);

router.post('/create/order/:userId', isAuth, orderController.createOrder);

router.post('/create/basket/:eventId', isAuth, orderController.createBasket);



module.exports = router;