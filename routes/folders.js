const express = require("express");
const folder = express();
const { isAuthenticated } = require("../middleware/authMiddleware");
const {
  validateGetSharedFolder,
  validateCreateFolder,
  validateGetFolderFiles,
  validateDeleteFolder,
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
  "/create", [...createFolderValidators],
  folderController.createFolder,
);

const getFolderFilesValidators = validateGetFolderFiles();
folder.get(
  "/files/:folder_id",
  [...getSharedFolderValidators],
  folderController.getAllFolderElements,
);

const getDeleteFolderValidators = validateDeleteFolder();
folder.get(
  "/delete/:folder_id",
  [...getDeleteFolderValidators],
  folderController.deleteFolder,
);

const getShareFolderValidators = validateGetSharedFolder();
folder.post("/share", [...getShareFolderValidators] ,folderController.shareFolder);

folder.post("/update", folderController.updateFolderName);

folder.get("/update/:folder_id", folderController.getUpdateFolderView);

module.exports = folder;
