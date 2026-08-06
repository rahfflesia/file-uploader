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
const Folder = require("../models/Folder");

async function redirect(req) {
  const folderId = req.params.folder_id;
  const folder = await Folder.getFolder(folderId);
  return folder.parent_folder_id === null
    ? "/dashboard"
    : `/folder/files/${folder.parent_folder_id}`;
}

// Aquí tengo que ver bien porque al redirigir a dashboard se pierde el mensaje de error
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
  handleValidationErrors((req) => {
    return req.body.parent_folder_id
      ? `/folder/files/${req.body.parent_folder_id}`
      : "/dashboard";
  }, createFolderValidators),
  folderController.createFolder,
);

const getFolderFilesValidators = validateGetFolderFiles();
folder.get(
  "/files/:folder_id",
  handleValidationErrors(() => "/dashboard", getFolderFilesValidators),
  folderController.getAllFolderElements,
);

const getDeleteFolderValidators = validateDeleteFolder();
folder.get(
  "/delete/:folder_id",
  handleValidationErrors(redirect, getDeleteFolderValidators),
  folderController.deleteFolder,
);

folder.post("/share", folderController.shareFolder);

folder.post("/update", folderController.updateFolderName);

folder.get("/update/:folder_id", folderController.getUpdateFolderView);

module.exports = folder;
