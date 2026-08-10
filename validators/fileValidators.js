const { body, param } = require("express-validator");

function updateFileValidator() {}

function validateDeleteFile() {
  return [
    param("file_id").
    trim().
    isInt({ min: 1 }).
    withMessage("Invalid id"),
  ];
}

module.exports = {
  updateFileValidator,
  validateDeleteFile
};
