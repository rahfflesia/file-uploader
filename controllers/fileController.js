const File = require("../models/File");
const cloudinary = require("cloudinary").v2;

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
  res.status(200).render("./files/fileDetails", { file: file });
}

module.exports = {
  deleteFile,
  getFileDetails,
};
