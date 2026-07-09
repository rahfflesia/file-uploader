const prisma = require("../lib/prisma");
const Folder = require("../models/Folder");

async function createFolder(req, res) {
  const folderData = {
    folder_name: req.body.folder_name,
    user_id: 1,
  };
  await Folder.createFolder(folderData);
  res.redirect("/dashboard");
}

async function getAllFolderFiles(req, res) {
  const folderId = req.params.folder_id;
  const folderFiles = await Folder.getAllFolderFiles(folderId);
  res.status(200).render("./folders/folderFiles", {
    files: folderFiles,
    folder_id: folderId,
  });
}

async function deleteFolder(req, res) {
  const folderId = req.params.folder_id;
  await Folder.deleteFolder(folderId);
  res.status(200).redirect("/dashboard");
}

// Aquí estoy mezclando lógica del modelo con la del controlador
// Luego le hago el refactor
async function shareFolder(req, res) {
  function isSharedFolder(arr) {
    for (const folder of arr) {
      if (Date.now() < folder.expires_at.getTime()) {
        return true;
      }
    }
    return false;
  }

  const folderHistory = await prisma.shared_folders.findMany({
    where: {
      folder_id: parseInt(req.body.folder_id),
    },
  });

  if (isSharedFolder(folderHistory)) {
    const userId = req.session.passport.user;
    const folders = await Folder.getAllUserFolders(userId);
    return res.status(200).render("dashboard", {
      errorMessage: "This folder has already been shared",
      folders: folders,
    });
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

module.exports = {
  createFolder,
  getAllFolderFiles,
  deleteFolder,
  shareFolder,
  getSharedFolder,
};
