const prisma = require("../lib/prisma");
const Folder = require("../models/Folder");
const { convertBytes, isSharedFolder } = require("../helpers/helpers");

async function createFolder(req, res) {
  const parentFolderId = req.body.parent_folder_id
    ? parseInt(req.body.parent_folder_id)
    : null;
  const folderData = {
    folder_name: req.body.folder_name,
    user_id: req.session.passport.user,
    parent_folder_id: parentFolderId,
  };

  await Folder.createFolder(folderData);

  if (parentFolderId === null) {
    return res.redirect("/dashboard");
  }

  res.redirect(`/folder/files/${req.body.parent_folder_id}`);
}

async function getAllFolderElements(req, res) {
  const userId = req.session.passport.user;
  const folderId = parseInt(req.params.folder_id);
  const folderData = await Folder.getFolder(folderId);

  if (folderData.user_id !== userId) {
    return res.status(401).send("<h1>No tienes acceso a este recurso</h1>");
  }

  const folderElements = await Folder.getAllElements(folderId);
  const folder = await Folder.getFolder(folderId);

  res.status(200).render("./folders/folderFiles", {
    elements: folderElements,
    folder: folder,
  });
}

async function deleteFolder(req, res) {
  const userId = req.session.passport.user;
  const folderId = req.params.folder_id;
  const folder = await Folder.getFolder(folderId);

  if (folder.user_id !== userId) {
    return res
      .status(401)
      .send("<h1>No tienes permiso para borrar esta carpeta</h1>");
  }

  await Folder.deleteFolder(folderId);
  res.status(200).redirect("/dashboard");
}

// Aquí estoy mezclando lógica del modelo con la del controlador
// Luego le hago el refactor
async function shareFolder(req, res) {
  const folderHistory = await prisma.shared_folders.findMany({
    where: {
      folder_id: parseInt(req.body.folder_id),
    },
  });

  if (isSharedFolder(folderHistory)) {
    return res.status(200).redirect("/dashboard");
  }

  const expirationDays = parseInt(req.body.expiration_days);
  const milisecondsPerDay = 24 * 60 * 60 * 1000;
  const expirationTimeMiliseconds =
    Date.now() + expirationDays * milisecondsPerDay;
  const expirationDate = new Date(expirationTimeMiliseconds);

  const data = {
    user_id: req.session.passport.user,
    folder_id: parseInt(req.body.folder_id),
    expires_at: expirationDate,
  };

  await prisma.shared_folders.create({
    data: data,
  });
  res.status(201).redirect("/dashboard");
}

async function getSharedFolder(req, res) {
  const uuid = req.params.uuid;
  const sharedFolder = await prisma.shared_folders.findUnique({
    where: {
      link_uuid: uuid,
    },
  });

  if (Date.now() > sharedFolder.expires_at.getTime()) {
    return res.status(410).render("expiredLink");
  }

  const sharedFolderFiles = await prisma.files.findMany({
    where: {
      folder_id: sharedFolder.folder_id,
    },
  });
  res
    .status(200)
    .render("./folders/sharedFolder", { sharedFolderFiles: sharedFolderFiles });
}

async function getUpdateFolderView(req, res) {
  const folder = await Folder.getFolder(parseInt(req.params.folder_id));
  const data = {
    folder_id: folder.folder_id,
    folder_name: folder.folder_name,
  };
  res.status(200).render("./folders/updateFolderName", { folder: data });
}

async function updateFolderName(req, res) {
  await Folder.updateFolderName(req.body);
  res.status(200).redirect("/dashboard");
}

module.exports = {
  createFolder,
  getAllFolderElements,
  deleteFolder,
  shareFolder,
  getSharedFolder,
  updateFolderName,
  getUpdateFolderView,
};
