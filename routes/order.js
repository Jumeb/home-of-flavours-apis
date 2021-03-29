const express = require('express');
const {body} = require('express-validator');

const router = express.Router();

const orderController = require('../controllers/order');
const isAuth = require('../middleware/isAuth');

router.get('/user/getorders/:userId', orderController.getMyOrders);

router.get('/baker/getorders/:bakerId', orderController.getBakerOrders);

router.get('/baker/getallorders', orderController.getSuperOrders);

router.post('/create/order/:userId', isAuth, orderController.createOrder);

router.post('/create/basket/:eventId', isAuth, orderController.createBasket);

router.put('/order/status/:orderId', orderController.incStatus);



module.exports = router;