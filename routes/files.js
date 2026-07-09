const express = require("express");
const file = express();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const cloudinary = require("cloudinary").v2;

const prisma = require("../lib/prisma");

const fileController = require("../controllers/fileController");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

file.post("/upload", upload.single("archivo"), async (req, res) => {
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
    folder_id: parseInt(req.body.folder_id),
    cloudinary_public_id: result.public_id,
    cloudinary_resource_type: result.resource_type,
  };
  const uploadedFile = await prisma.files.create({
    data: fileData,
  });
  res.status(201).redirect(`/folder/files/${uploadedFile.folder_id}`);
});

file.get("/delete/:file_id", fileController.deleteFile);

file.get("/details/:file_id", fileController.getFileDetails);

module.exports = file;
