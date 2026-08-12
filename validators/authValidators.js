const { body, query } = require("express-validator");
const User = require("../models/User");

function validateSignUp() {
  return [
    body("first_name")
      .isString()
      .withMessage("The first name must be a string")
      .trim()
      .notEmpty()
      .withMessage("The first name cannot be empty")
      .isAlpha("es-ES", { ignore: " " })
      .withMessage("The first name can only containt letters and whitespace")
      .isLength({ min: 2, max: 512 })
      .withMessage(
        "The first name length must be between 2 and 512 characters",
      ),
    body("last_name")
      .isString()
      .withMessage("The las name must be a string")
      .trim()
      .notEmpty()
      .withMessage("The last name cannot be empty")
      .isAlpha("es-ES", { ignore: " " })
      .withMessage("The last name can only contain letters and whitespace")
      .isLength({ min: 2, max: 512 })
      .withMessage("The last name length must be between 2 and 512 characters"),
    body("email")
      .isString()
      .withMessage("The email must be a string")
      .trim()
      .notEmpty()
      .withMessage("The email cannot be empty")
      .isEmail()
      .withMessage("Invalid email")
      .isLength({ min: 4, max: 320 })
      .withMessage("The email length must be between 4 and 320 characters")
      .custom(async (email) => {
        const user = await User.findUserByEmail(email);

        if (user) {
          throw new Error("Email already in use");
        }
      })
      .withMessage("That email is already in use"),
    body("password")
      .isString()
      .withMessage("The password must be a string")
      .trim()
      .notEmpty()
      .withMessage("The password cannot be empty")
      .isLength({ min: 8 })
      .withMessage("The password must be at least 8 characters long")
      .custom((password, { req }) => {
        return password === req.body.confirmed_password;
      })
      .withMessage("Passwords do not match"),
    body("confirmed_password")
      .isString()
      .withMessage("The confirmed password must be a string")
      .trim()
      .notEmpty()
      .withMessage("The confirmed password cannot be empty")
      .isLength({ min: 8 })
      .withMessage("The confirmed password must be at least 8 characters long"),
  ];
}

function validateLogIn() {
  return [
    body("username")
      .isString()
      .withMessage("The email must be a string")
      .trim()
      .notEmpty()
      .withMessage("The email cannot be empty")
      .isEmail()
      .withMessage("The email must be a valid one, example: mail@domain.com")
      .isLength({ min: 4, max: 320 })
      .withMessage("The email length must be between 4 and 320 characters"),
    body("password")
      .isString()
      .withMessage("The password must be a string")
      .trim()
      .notEmpty()
      .withMessage("The password cannot be empty")
      .isLength({ min: 8 })
      .withMessage("The password must be at least 8 characters long"),
  ];
}

function validateDashboard() {
  return [ 
  query("q")
  .optional({ values: "undefined" })
  .isString()
  .withMessage("Invalid search term")
  .bail()
  .trim()
  .notEmpty()
  .withMessage("The search term cannot be empty")
  .bail()
  .isLength({min: 1, max: 2048})
  .withMessage("The search term is too long") ];
}

module.exports = {
  validateSignUp,
  validateLogIn,
  validateDashboard
};
