const { body, param } = require("express-validator");

function updateFileValidator() {}

function validateId() {
  return [param("file_id").trim().isInt({ min: 1 }).withMessage("Invalid id")];
}

function validateUpdateFile() {
  return [
    body("file_id")
      .optional({ values: "falsy" })
      .trim()
      .isInt({ min: 1 })
      .withMessage("Invalid id"),
  ];
}

function validateShareFile() {
  return [
    body("file_id").trim().isInt({ min: 1 }).withMessage("Invalid id"),
    body("expiration_days")
      .trim()
      .isInt({ min: 1, max: 30 })
      .withMessage("Invalid expiration days"),
  ];
}

function validateUploadFile() {
  return [
    body("folder_id")
      .optional({ values: "falsy" })
      .trim()
      .isInt({ min: 1 })
      .withMessage("Invalid id"),
  ];
}

module.exports = {
  updateFileValidator,
  validateId,
  validateUpdateFile,
  validateShareFile,
  validateUploadFile,
};
