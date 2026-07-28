const { body } = require("express-validator");

function validateSignUp() {
  return [
    body("first_name")
      .isString()
      .withMessage("The first name must be a string")
      .trim()
      .notEmpty()
      .withMessage("The first name cannot be empty")
      .isAlpha("en-US", { ignore: " " })
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
      .isAlpha("en-US")
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
      .withMessage("The email length must be between 4 and 320 characters"),
    body("password")
      .isString()
      .withMessage("The password must be a string")
      .trim()
      .notEmpty()
      .withMessage("The password cannot be empty")
      .isLength({ min: 8 })
      .withMessage("The password must be at least 8 characters long"),
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
    body("email")
      .isString()
      .withMessage("The email must be a string")
      .trim()
      .notEmpty()
      .withMessage("The email cannot be empty")
      .isEmail()
      .withMessage("The email must be a valid one, example: mail@domain.com")
      .isLength({ min: 4, max: 320 })
      .withMessage("The email length must be between 4 and 320 characters"),
    body("username")
      .isString()
      .withMessage("The password must be a string")
      .trim()
      .notEmpty()
      .withMessage("The password cannot be empty")
      .isLength({ min: 8 })
      .withMessage("The password must be at least 8 characters long"),
  ];
}

module.exports = {
  validateSignUp,
  validateLogIn,
};
