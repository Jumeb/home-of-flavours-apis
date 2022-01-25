const path = require('path');
const fs = require('fs');
const express = require("express");
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const Admin = require('./model/admin');

const bakerRoutes = require('./routes/bakers');
const userRoutes = require('./routes/user');
const pastryRoutes = require('./routes/pastry');
const orderRoutes = require('./routes/order');
const adminRoutes = require('./routes/admin');

// const {
//     bakerRoutes, 
//     userRoutes, 
//     pastryRoutes, 4FEB6pvc8LI9Ru7D
//     orderRoutes, 
// } = require('./routes');

const {
    fileStorage,
    fileFilter
} = require('./utils/utilities');

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@homeofflavours.7nvfr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// const MONGODB_URI = 'mongodb://localhost:27017/CaraCakes';

const fields = [{
    name: 'image',
    maxCount: 2,
},
{
    name: 'logo',
    maxCount: 1
},
{
    name: 'pastryImage',
    maxCount: 3
},
];

const accessLog = fs.createWriteStream(
    path.join(__dirname, 'access.log'), {
        flags: 'a'
    }
)

const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan('combined', {
    stream: accessLog
}));

app.use(bodyParser.json()); //application/json

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // 1
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PATCH, DELETE, PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(
    multer({
        storage: fileStorage,
        fileFilter: fileFilter
    }).fields(fields)
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
    res.status(status).json({
        message: message,
        data: data
    })
})

const port = process.env.PORT || 8082;

mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(result => {
        console.log('Connected');
        Admin.findOne()
            .then(admin => {
                if (!admin) {
                    bcrypt.hash('1234567', 12).then(hashPassword => {
                        const admin = new Admin({
                            name: 'JBInc',
                            password: hashPassword,
                            email: 'bricejume@gmail.com'
                        });
                        admin.save();
                    })
                }
            })
    })
    .then(result => {
        const server = app.listen(port);
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