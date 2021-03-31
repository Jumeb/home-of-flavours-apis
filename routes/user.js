const express = require("express");
const { body } = require("express-validator");

const userController = require("../controllers/user");
const User = require("../model/user");

const router = express.Router();

router.get("/user/getcart/:userId", userController.getCart);

router.post(
  "/user/register",
  [
    body("email")
      .isEmail()
      .withMessage("Enter a valid email")
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("E-mail is already in use.");
          }
        });
      })
      .normalizeEmail(),
    body("password").trim().isLength({ min: 5 }),
    body("name").trim().isLength({ min: 5 }),
  ],
  userController.register
);

router.post("/user/login", userController.login);

router.post("/user/addToCart/:pastryId", userController.postCart);

router.post("/user/subFromCart/:pastryId", userController.subFromCart);

router.post("/user/removeFromCart/:pastryId", userController.removeFromCart);

router.post("/user/message/:pastryId", userController.pastryMessage);

router.put("/user/image/:userId", userController.editUserImage);

router.put("/user/profile/:userId", userController.editUser);

module.exports = router;
