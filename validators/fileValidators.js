const { body, param } = require("express-validator");

function updateFileValidator() {}

function validateId() {
  return [
    param("file_id").
    trim().
    isInt({ min: 1 }).
    withMessage("Invalid id"),
  ];
}

function validateUpdateFile() {
  return [
    body("file_id").
      trim()
      .isInt({ min: 1 })
      .withMessage("Invalid id"),
    body("file_name").
      isString().
      withMessage("The file name must be a string").
      bail().
      trim().
      notEmpty("The file name cannot be empty").
      bail().
      isLength({ min: 1, max: 128 }).
      withMessage("The maximum length for a file name is 128 characters")
  ];
}

function validateShareFile() {
  return [
  body("file_id")
    .trim()
    .isInt({ min: 1 })
    .withMessage("Invalid id"),
  body("expiration_days")
    .trim()
    .isInt({ min: 1, max: 30 })
    .withMessage("Invalid expiration days")
  ];
}

function validateUploadFile() {
  return [
    body("file_id")
      .optional({values: "falsy"})
      .trim()
      .isInt({ min: 1 })
      .withMessage("Invalid id")
  ];
}

module.exports = {
  updateFileValidator,
  validateId,
  validateUpdateFile,
  validateShareFile,
  validateUploadFile
};
