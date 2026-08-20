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
  validateDownloadFolder,
} = require("../validators/folderValidators");

const folderController = require("../controllers/folderController");

// Aquí tengo que ver bien porque al redirigir a dashboard se pierde el mensaje de error
const getSharedFolderValidators = validateGetSharedFolder();
folder.get(
  "/share/:uuid",
  [...getSharedFolderValidators],
  folderController.getSharedFolder,
);

folder.get("/shared/download/:uuid", folderController.downloadSharedFolder);

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
folder.post("/share", [...shareFolderValidators], folderController.shareFolder);

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

const getDownloadFolderValidator = validateDownloadFolder();
folder.get("/download/:folder_id", [...getDownloadFolderValidator], folderController.downloadFolder);

module.exports = folder;
