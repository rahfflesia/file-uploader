const express = require("express");
const file = express();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const cloudinary = require("cloudinary").v2;
const { isAuthenticated } = require("../middleware/authMiddleware");
const { validateId, validateShareFile, validateUpdateFile } = require("../validators/fileValidators");

const fileController = require("../controllers/fileController");

file.use(isAuthenticated);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileValidators = validateUpdateFile();

file.post("/upload", [...uploadFileValidators], upload.single("archivo"), fileController.uploadFile);

const idValidators = validateId();

file.get("/delete/:file_id", [...idValidators] ,fileController.deleteFile);

file.get("/details/:file_id", [...idValidators] ,fileController.getFileDetails);

file.get("/update/:file_id", [...idValidators] ,fileController.getUpdateFileNameView);

const updateFileValidators = validateUpdateFile();

file.post("/update", [...updateFileValidators] ,fileController.updateFileName);

const shareFileValidators = validateShareFile();

file.post("/share", [...shareFileValidators] ,fileController.shareFile);

module.exports = file;
