const express = require("express");
const file = express();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const cloudinary = require("cloudinary").v2;
const Folder = require("../models/Folder");
const { convertBytes } = require("../helpers/helpers");

const prisma = require("../lib/prisma");

const fileController = require("../controllers/fileController");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

file.post("/upload", upload.single("archivo"), async (req, res) => {
  const folderId = parseInt(req.body.folder_id);
  const mb = 1048576;

  // Max size is 100mb for video, for everything else is 10mb
  if (
    (!req.file.mimetype.includes("video") &&
      req.file.buffer.length > mb * 10) ||
    (req.file.mimetype.includes("video") && req.file.buffer.length > mb * 100)
  ) {
    const files = (await Folder.getAllFolderFiles(folderId)).map((file) => {
      return {
        ...file,
        bytes: convertBytes(file.bytes),
      };
    });
    return res.status(413).render("./folders/folderFiles", {
      files: files,
      errorMessage:
        "The file is too large (100 MB Max for video and 10 MB for other type of files)",
      folder_id: folderId,
    });
  }

  const byteArrayBuffer = req.file.buffer;
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { resource_type: "auto", folder: "file_uploader" },
        (error, uploadResult) => {
          if (error) {
            return reject(error);
          }
          return resolve(uploadResult);
        },
      )
      .end(byteArrayBuffer);
  });
  const fileData = {
    file_name: req.file.originalname,
    url: result.secure_url,
    folder_id: folderId,
    cloudinary_public_id: result.public_id,
    cloudinary_resource_type: result.resource_type,
    bytes: result.bytes,
  };
  const uploadedFile = await prisma.files.create({
    data: fileData,
  });
  res.status(201).redirect(`/folder/files/${folderId}`);
});

file.get("/delete/:file_id", fileController.deleteFile);

file.get("/details/:file_id", fileController.getFileDetails);

module.exports = file;
