const File = require("../models/File");
const cloudinary = require("cloudinary").v2;
const { convertBytes } = require("../helpers/helpers");

async function deleteFile(req, res) {
  const fileId = req.params.file_id;
  const deletedFile = await File.deleteFile(fileId);
  await cloudinary.uploader.destroy(deletedFile.cloudinary_public_id, {
    resource_type: deletedFile.cloudinary_resource_type,
    invalidate: true,
  });
  res.redirect(`/folder/files/${deletedFile.folder_id}`);
}

async function getFileDetails(req, res) {
  const fileId = req.params.file_id;
  const file = await File.getFileDetails(fileId);
  const formatedFile = {
    ...file,
    size: convertBytes(file.bytes),
  };
  res.status(200).render("./files/fileDetails", { file: formatedFile });
}

async function getUpdateFileNameView(req, res) {
  const fileId = req.params.file_id;
  const file = await File.getFileDetails(fileId);
  res.status(200).render("./files/updateFileName", { file: file });
}

async function updateFileName(req, res) {
  const updatedFile = await File.updateFileName(req.body);
  res.status(200).redirect(`/folder/files/${updatedFile.folder_id}`);
}

module.exports = {
  deleteFile,
  getFileDetails,
  getUpdateFileNameView,
  updateFileName,
};
