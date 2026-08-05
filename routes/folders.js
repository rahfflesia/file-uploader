const express = require("express");
const folder = express();
const { isAuthenticated } = require("../middleware/authMiddleware");
const {
  validateGetSharedFolder,
  validateCreateFolder,
  validateGetFolderFiles,
  validateDeleteFolder,
} = require("../validators/folderValidators");
const { handleValidationErrors } = require("../middleware/errorMiddleware");

const folderController = require("../controllers/folderController");

const getSharedFolderValidators = validateGetSharedFolder();
folder.get(
  "/share/:uuid",
  handleValidationErrors("/auth/log-in", getSharedFolderValidators),
  folderController.getSharedFolder,
);

folder.use(isAuthenticated);

const createFolderValidators = validateCreateFolder();
folder.post(
  "/create",
  handleValidationErrors("/dashboard", createFolderValidators),
  folderController.createFolder,
);

const getFolderFilesValidators = validateGetFolderFiles();
folder.get(
  "/files/:folder_id",
  handleValidationErrors("/folder/files", getFolderFilesValidators),
  folderController.getAllFolderElements,
);

const getDeleteFolderValidators = validateDeleteFolder();
folder.get(
  "/delete/:folder_id",
  handleValidationErrors("/folder/files", getDeleteFolderValidators),
  folderController.deleteFolder,
);

folder.post("/share", folderController.shareFolder);

folder.post("/update", folderController.updateFolderName);

folder.get("/update/:folder_id", folderController.getUpdateFolderView);

module.exports = folder;
