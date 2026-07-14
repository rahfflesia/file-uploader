const express = require("express");
const folder = express();
const crpyto = require("crypto");

const folderController = require("../controllers/folderController");

folder.post("/create", folderController.createFolder);

folder.get("/files/:folder_id", folderController.getAllFolderFiles);

folder.get("/delete/:folder_id", folderController.deleteFolder);

folder.get("/share/:uuid", folderController.getSharedFolder);

folder.post("/share", folderController.shareFolder);

folder.post("/update", folderController.updateFolderName);

folder.get("/update/:folder_id", folderController.getUpdateFolderView);

module.exports = folder;
