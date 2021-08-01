const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const jwt = require("jsonwebtoken");

const User = require("../model/user");
const Pastry = require("../model/pastry");
const {
  errorCode,
  clearImage,
  validationError,
  authenticationError,
} = require("../utils/utilities");
const baker = require("../model/baker");

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: "OAUTH2",
        user: process.env.GMAIL_USERNAME,  //set these in your .env file
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        // user: process.env.EMAIL,
        // pass: process.env.PASSWORD
    }
});

transporter.use('compile', hbs({
    viewEngine: {
        extname: '.handlebars',
        layoutsDir: './views/',
        defaultLayout : 'index',
    },
    viewPath: './views/'
}));

exports.register = (req, res, next) => {
  validationError(req, "Validation failed, entered data is incorrect", 422);

  const name = req.body.name;
  const email = req.body.email;
  const telNo = req.body.tel;
  const password = req.body.password;

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const user = new User({
        name,
        email: email,
        telNumber: telNo,
        password: hashedPassword,
      });
      return user.save();
    })
    .then(user => {
      transporter.sendMail({
        from: '"Jume Brice 👻" <bricejume@gmail.com>',
        to: email,
        subject: "Welcome to Home of Flavours",
        text: "You have successfully signed up in HOF",
        template: 'welcomeUser',
        context: {
          name: name,
        }
      })
      return user;
    })
    .then((result) => {
      res.status(201).json({ message: "User created", userId: result._id });
    })
    .catch((error) => {
      errorCode(error, 500, next);
    });
};

exports.login = (req, res, next) => {
  validationError(req, "Validation failed, entered data is incorrect", 422);

  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        const error = new Error("User not found.");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
      }

      if (loadedUser.suspend) {
        const error = new Error(
          `Mr/Miss, ${loadedUser.name}, your account has been suspended. Please contact our support team.`
        );
        error.statusCode = 402;
        throw error;
      }

      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
          name: loadedUser.name,
        },
        "somesupersecret",
        { expiresIn: "90d" }
      );
      res.status(200).json({
        token: token,
        user: loadedUser,
      });
    })
    .catch((err) => {
      errorCode(err, 500, next);
    });
};

exports.getCart = (req, res, next) => {
  validationError(req, "An error occured", 422);
  const userId = req.params.userId;
  let pastries;

  User.findById(userId)
    .populate({
      path: "cart.pastries.pastryId",
      populate: {
        path: "creator",
        select: "companyName name suspend verify",
      },
    })
    .then((user) => {
      let obj = {};
      pastries = user.cart.pastries;
      const data = (cart) => {
        cart.map((i) => {
          let _baker = i.pastryId.creator.companyName.toString();
          if (obj[_baker] === undefined) {
            obj[_baker] = [i];
          } else {
            obj[_baker].push(i);
          }
        });
        return obj;
      };
      let bakers = data(pastries);
      res.status(200).json({
        message: "Success",
        bakers: bakers,
        user: user.cart.pastries,
      });
    });
};

exports.postCart = (req, res, next) => {
  const pastryId = req.params.pastryId;
  const userId = req.query.user;

  validationError(req, "An error occured", 422);

  Pastry.findById(pastryId)
    .then((pastry) => {
      User.findById(userId)
        .then((user) => {
          return user.addToCart(pastry._id);
        })
        .then((result) => {
          res.status(200).json({ message: "Success" });
        });
    })
    .catch((err) => {
      errorCode(err, 500, next);
    });
};

exports.subFromCart = (req, res, next) => {
  const pastryId = req.params.pastryId;
  const userId = req.query.user;

  validationError(req, "An error occured", 422);

  Pastry.findById(pastryId)
    .then((pastry) => {
      User.findById(userId)
        .then((user) => {
          return user.subFromCart(pastry._id);
        })
        .then((result) => {
          res.status(200).json({ message: "Success" });
        });
    })
    .catch((err) => {
      errorCode(err, 500, next);
    });
};

exports.addToCart = (req, res, next) => {
    const { cart } = req.body;
    const userId = req.params.userId;

    validationError(req, "An error occured", 422);

    User.findById(userId)
        .then(user => {
            return user.postCart(JSON.parse(cart));
        })
        .then(result => {
            res.status(200).json({ message: "Added to Cart" });
        })
        .catch(err => {
            errorCode(err, 500, next);
    })
}

exports.pastryMessage = (req, res, next) => {
  const pastryId = req.params.pastryId;
  const userId = req.query.user;
  const message = req.query.message;

  validationError(req, "An error occured", 422);

  Pastry.findById(pastryId)
    .then((pastry) => {
      User.findById(userId)
        .then((user) => {
          return user.message(pastry._id, message);
        })
        .then((result) => {
          res.status(200).json({ message: "Success" });
        });
    })
    .catch((err) => {
      errorCode(err, 500, next);
    });
};

exports.removeFromCart = (req, res, next) => {
  const pastryId = req.params.pastryId;
  const userId = req.query.user;

  validationError(req, "An error occured", 422);

  Pastry.findById(pastryId)
    .then((pastry) => {
      User.findById(userId)
        .then((user) => {
          return user.removeFromCart(pastry._id);
        })
          .then((result) => {
          res.status(200).json({ message: "Success" });
        });
    })
    .catch((err) => {
      errorCode(err, 500, next);
    });
};

exports.editUser = (req, res, next) => {
  validationError(req, 'An error occured', 422);

  const userId = req.params.userId;

  const { name, email, contact, location } = req.body;

  User.findById(userId)
    .populate({
      path: 'orders.ordered.orderId',
      select: 'pastries status',
      populate: {
        path: 'pastries.pastryId',
        select: 'price discount',
      }
    })
    .then(user => {
      if (!user) {
        authenticationError('User not found.', 404);
      }
      
      user.name = name || user.name;
      user.email = email || user.email;
      user.telNumber = contact || user.telNumber;
      user.location = location || user.location;

      return user.save();
    })
    .then(user => {
      res.status(200).json({ message: 'Successfully updated profile', user });
    })
    .catch(err => {
      errorCode(err, 500, next);
    })

};

exports.editUserImage = (req, res, next) => {
  validationError(req, 'An error occured', 422);

  const userId = req.params.userId;

  let image;

  if (req.files.image) {
    image = req.files.image[0].path;
  }

  User.findById(userId)
    .populate({
      path: 'orders.ordered.orderId',
      select: 'pastries status',
      populate: {
        path: 'pastries.pastryId',
        select: 'price discount',
      }
    })
    .then(user => {
      if (!user) {
        authenticationError('User not found', 404);
      }
      if (image !== user.image) {
        clearImage(user.image);
      }

      user.image = image;
      return user.save();
    })
    .then(user => {
      res.status(200).json({ message: 'Image successfully updated', user });
    })
    .catch(err => {
      errorCode(err, 500, next);
    })
};

exports.likeUser = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const userId = req.params.userId;
    const bakerId = req.query.baker

    User.findById(userId)
        .then(user => {
            return user.like(bakerId);
        })
        .then(result => {
            res.status(200).json({message: 'Liked user', response: result})
        })
        .catch(err => {
            res.status(500).json({message: 'Unsuccessful!'})
        })
}

exports.disLikeUser = (req, res, next) => {
    validationError(req, 'An error occured', 422);

    const userId = req.params.userId;
    const bakerId = req.query.baker

    User.findById(userId)
        .then(user => {
            return user.dislike(bakerId);
        })
        .then(result => {
            res.status(200).json({message: 'Dislked user', response: result})
        })
        .catch(err => {
            res.status(500).json({message: 'Unsuccessful!'})
        })
}