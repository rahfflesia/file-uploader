const express = require("express");
const folder = express();
const { isAuthenticated } = require("../middleware/authMiddleware");
const {
  validateGetSharedFolder,
  validateCreateFolder,
  validateGetFolderFiles,
  validateDeleteFolder,
  validateShareFolder,
  validateUpdateFolder,
  validateUpdateFolderView,
} = require("../validators/folderValidators");

const folderController = require("../controllers/folderController");
const Folder = require("../models/Folder");

// Aquí tengo que ver bien porque al redirigir a dashboard se pierde el mensaje de error
const getSharedFolderValidators = validateGetSharedFolder();
folder.get(
  "/share/:uuid",
  [...getSharedFolderValidators],
  folderController.getSharedFolder,
);

folder.use(isAuthenticated);

const createFolderValidators = validateCreateFolder();
folder.post(
  "/create",
  [...createFolderValidators],
  folderController.createFolder,
);

const getFolderFilesValidators = validateGetFolderFiles();
folder.get(
  "/files/:folder_id",
  [...getFolderFilesValidators],
  folderController.getAllFolderElements,
);

const getDeleteFolderValidators = validateDeleteFolder();
folder.get(
  "/delete/:folder_id",
  [...getDeleteFolderValidators],
  folderController.deleteFolder,
);

const shareFolderValidators = validateShareFolder();
folder.post(
  "/share",
  [...shareFolderValidators],
  folderController.shareFolder,
);

const getUpdateFolderValidators = validateUpdateFolder();
folder.post(
  "/update",
  [...getUpdateFolderValidators],
  folderController.updateFolderName,
);

const getUpdateFolderViewValidators = validateUpdateFolderView();
folder.get(
  "/update/:folder_id",
  [...getUpdateFolderViewValidators],
  folderController.getUpdateFolderView,
);

module.exports = folder;
