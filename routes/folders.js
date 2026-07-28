const express = require("express");
const folder = express();
const crpyto = require("crypto");
const { isAuthenticated } = require("../middleware/authMiddleware");

const folderController = require("../controllers/folderController");

folder.get("/share/:uuid", folderController.getSharedFolder);

folder.use(isAuthenticated);

folder.post("/create", folderController.createFolder);

folder.get("/files/:folder_id", folderController.getAllFolderElements);

folder.get("/delete/:folder_id", folderController.deleteFolder);

folder.post("/share", folderController.shareFolder);

folder.post("/update", folderController.updateFolderName);

folder.get("/update/:folder_id", folderController.getUpdateFolderView);

module.exports = folder;
