const File = require("../models/File");
const cloudinary = require("cloudinary").v2;
const { convertBytes, isSharedFile } = require("../helpers/helpers");
const prisma = require("../lib/prisma");

async function deleteFile(req, res) {
  const fileId = req.params.file_id;
  const deletedFile = await File.deleteFile(fileId);
  await cloudinary.uploader.destroy(deletedFile.cloudinary_public_id, {
    resource_type: deletedFile.cloudinary_resource_type,
    invalidate: true,
  });

  if (deletedFile.folder_id === null) {
    return res.status(200).redirect("/dashboard");
  }

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
  if (updatedFile.folder_id === null) {
    return res.status(200).redirect("/dashboard");
  }
  res.status(200).redirect(`/folder/files/${updatedFile.folder_id}`);
}

async function shareFile(req, res) {
  const fileId = parseInt(req.body.file_id);
  const fileHistory = await prisma.shared_files.findMany({
    where: {
      file_id: fileId,
    },
  });

  if (isSharedFile(fileHistory)) {
    return res.send("<h1>File already shared</h1>");
  }

  const expirationDays = parseInt(req.body.expiration_days);
  const milisecondsPerDay = 24 * 60 * 60 * 1000;
  const expirationTimeMiliseconds =
    Date.now() + expirationDays * milisecondsPerDay;
  const expirationDate = new Date(expirationTimeMiliseconds);

  const data = {
    user_id: req.session.passport.user,
    file_id: fileId,
    expires_at: expirationDate,
  };

  await prisma.shared_files.create({
    data: data,
  });

  res.status(201).redirect("/dashboard");
}

async function getSharedFiles(req, res) {}

module.exports = {
  deleteFile,
  getFileDetails,
  getUpdateFileNameView,
  updateFileName,
  shareFile,
};
