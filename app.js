const path = require('path');
const express = require("express");
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('./model/admin');

const bakerRoutes = require('./routes/bakers');
const userRoutes = require('./routes/user');
const pastryRoutes = require('./routes/pastry');
const orderRoutes = require('./routes/order');
const adminRoutes = require('./routes/admin');

// const {
//     bakerRoutes, 
//     userRoutes, 
//     pastryRoutes, 
//     orderRoutes, 
// } = require('./routes');

const {fileStorage, fileFilter} = require('./utils/utilities');

const MONGODB_URI = 'mongodb://localhost:27017/CaraCakes';
const fields = [
    {name: 'userImage'},
    {name: 'logo'},
    {name: 'bakerImage'},
    {name: 'pastryImage'},
]

const app = express();

app.use(bodyParser.json()); //application/json

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // 1
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PATCH, DELETE, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
    multer({storage: fileStorage, fileFilter: fileFilter}).fields(fields)
)

app.use(bakerRoutes);
app.use(userRoutes);
app.use(pastryRoutes);
app.use(orderRoutes);
app.use(adminRoutes);

app.use((error, req, res, next) => {
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data: data})
})

mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(result => {
        const server = app.listen(8081);
        const io = require('socket.io')(server);
        io.on('connection', socket => {
            console.log('Client Connected');
        })
    })
    .catch(err => console.log(err));




/**
 * 1) the start (*) means every link should have access, or you put the links you want to have access
 * example: codepen.io, digitalrenter.com, houseOfflavours.org
 */
