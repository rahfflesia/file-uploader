const { param, body, query } = require("express-validator");

function validateGetSharedFolder() {
  return [
    param("uuid")
      .isString()
      .withMessage("The link identifier must be a string")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("The link identifier cannot be empty")
      .bail()
      .isUUID()
      .withMessage("The link identifier is not valid"),
  ];
}

function validateCreateFolder() {
  return [
    body("parent_folder_id")
      .optional({ values: "falsy" })
      .bail()
      .isInt({ min: 1 })
      .withMessage("The parent folder id must be a positive integer")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("The parent folder id cannot be empty"),
    body("folder_name")
      .isString()
      .withMessage("The folder name must be a string")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("The folder name cannot be empty")
      .bail()
      .isLength({ min: 1, max: 128 })
      .withMessage(
        "The folder name length must be between 1 and 128 characters",
      ),
  ];
}

function validateGetFolderFiles() {
  return [
    param("folder_id")
      .isInt({ min: 1 })
      .withMessage("Invalid folder id")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("The id cannot be empty"),  
    query("q")
    .optional({values: "undefined"}) 
    .isString().withMessage("Invalid search term").bail()     
    .trim()
    .notEmpty()
    .withMessage("The search term cannot be empty")
    .bail()
    .isLength({min: 1, max: 2048})
    .withMessage("The search term is too long")
  ];
}

function validateDeleteFolder() {
  return [
    param("folder_id")
      .isInt({ min: 1 })
      .withMessage("Invalid folder id")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("The id cannot be empty"),
  ];
}

function validateShareFolder() {
  return [
    body("expiration_days")
      .isInt({ min: 1, max: 30 })
      .withMessage("Invalid expiration days")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("The expiration days cannot be empty"),
    body("folder_id")
      .isInt({ min: 1 })
      .withMessage("Invalid folder id")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("The id cannot be empty"),
  ];
}

function validateUpdateFolder() {
  return [
    body("folder_id").trim().isInt({ min: 1 }).withMessage("Invalid id").bail(),
    body("folder_name")
      .isString()
      .withMessage("The folder name must be a string")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("The folder name cannot be empty")
      .bail()
      .isLength({ min: 1, max: 128 })
      .withMessage("The folder name must be between 1 and 128 characters"),
  ];
}

function validateUpdateFolderView() {
  return [
    param("folder_id")
      .isInt({ min: 1 })
      .withMessage("Invalid id")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("The id cannot be empty"),
  ];
}

function validateDownloadFolder() {
  return [
    param("folder_id")
      .isInt({ min: 1 })
      .withMessage("Invalid id")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("The id cannot be empty"),
  ];
}

module.exports = {
  validateGetSharedFolder,
  validateCreateFolder,
  validateGetFolderFiles,
  validateDeleteFolder,
  validateShareFolder,
  validateUpdateFolder,
  validateUpdateFolderView,
  validateDownloadFolder
};
