const { param, body } = require("express-validator");
const Folder = require("../models/Folder");

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
      .withMessage("The link identifier is not valid")
      .bail()
      .custom(async (uuid) => {
        const resourceUUID = uuid;
        const sharedFolder = await Folder.findSharedFolder(resourceUUID);
        const sharedFile = await Folder.findSharedFile(resourceUUID);

        if (!sharedFolder && !sharedFile) {
          throw new Error("No resource is associated to that link");
        }
      }),
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

async function isExistingFolder(id) {
  const folderId = parseInt(id);
  const folder = await Folder.getFolder(folderId);

  if (!folder) {
    throw new Error("No folder was found");
  }
}

function validateGetFolderFiles() {
  return [
    param("folder_id")
      .isInt({ min: 1 })
      .withMessage("Invalid folder id")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("The id cannot be empty")
      .bail()
      .custom(isExistingFolder),
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
      .withMessage("The id cannot be empty")
      .bail()
      .custom(isExistingFolder),
  ];
}

function validateShareFolder() {
  return [
    body("expirations_days")
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
      .withMessage("The id cannot be empty")
      .bail()
      .custom(isExistingFolder),
  ];
}

module.exports = {
  validateGetSharedFolder,
  validateCreateFolder,
  validateGetFolderFiles,
  validateDeleteFolder,
};
