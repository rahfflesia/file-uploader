const Folder = require("../models/Folder");
const { convertBytes, isSharedFolder } = require("../helpers/helpers");
const { validationResult, matchedData } = require("express-validator");
const File = require("../models/File");
const User = require("../models/User");
const { mkdir } = require("node:fs/promises");
const https = require("https");
const fs = require("fs");
const { Readable } = require("stream");
const { finished } = require("stream/promises");
const { zip } = require("zip-a-folder");
const { randomUUID } = require("node:crypto");
const { rm } = require("node:fs");

const dashboardRoute = "/dashboard";

// Function to recreate the folder structure when downloading a folder it is not a controller
async function recreateFolder(folderId, path, uuid) {
  const folderData = await Folder.getFolder(folderId);
  const elements = await Folder.getAllElements(folderId);

  let currentPath = uuid !== null ? `${uuid}/` : path;

  if (uuid === null) {
    currentPath += `${folderData.folder_name}/`;
  }

  await mkdir(currentPath);

  const files = elements.filter((resource) => resource.type === "file");
  const folders = elements.filter((resource) => resource.type === "folder");

  for (const file of files) {
    try {
      const stream = fs.createWriteStream(`${currentPath}${file.file_name}`);
      const { body } = await fetch(file.url);
      await finished(Readable.fromWeb(body).pipe(stream));
    } catch (err) {
      throw err;
    }
  }

  for (const folder of folders) {
    await recreateFolder(folder.folder_id, currentPath, null);
  }
}

async function createFolder(req, res, next) {
  try {
    const result = validationResult(req);
    const parentFolderId = req.body.parent_folder_id
      ? parseInt(req.body.parent_folder_id)
      : null;

    if (!result.isEmpty()) {
      req.flash("error", result.array());

      if (!parentFolderId) {
        return res.redirect(dashboardRoute);
      } else {
        return res.redirect(`/folder/files/${parentFolderId}`);
      }
    }

    const data = matchedData(req);

    const folderData = {
      folder_name: data.folder_name,
      user_id: req.session.passport.user,
      parent_folder_id: parentFolderId,
    };

    await Folder.createFolder(folderData);

    if (parentFolderId === null) {
      req.flash("success", "Folder created successfully");
      return res.status(201).redirect(dashboardRoute);
    }

    req.flash("success", "Folder created successfully");
    res.status(201).redirect(`/folder/files/${req.body.parent_folder_id}`);
  } catch (err) {
    next(err);
  }
}

async function getAllFolderElements(req, res, next) {
  try {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      req.flash("error", result.array());
      return res.redirect(dashboardRoute);
    }

    const data = matchedData(req);
    const userId = req.session.passport.user;
    const folderId = parseInt(data.folder_id);
    const folderData = await Folder.getFolder(folderId);

    if (!folderData) {
      req.flash("error", "No folder found");
      return res.redirect(dashboardRoute);
    }

    if (folderData.user_id !== userId) {
      req.flash("error", "You don't have access to this resource");
      return res.redirect(dashboardRoute);
    }

    const q = data.q?.toLowerCase();
    const folderElements = await Folder.getAllElements(folderId);
    const filteredFolderElements = q
      ? folderElements.filter(
          (element) =>
            element.folder_name?.toLowerCase().includes(q) ||
            element.file_name?.toLowerCase().includes(q),
        )
      : folderElements;
    const source = q ? "search" : "none";

    const searchData = {
      rootData: filteredFolderElements,
      source: source,
    };

    async function getPath() {
      let currentFolder = folderData;
      let foldersArray = [currentFolder];

      while (currentFolder.parent_folder_id !== null) {
        currentFolder = await Folder.getFolder(currentFolder.parent_folder_id);
        foldersArray.push(currentFolder);
      }

      return foldersArray;
    }

    const pathArray = (await getPath()).reverse();

    res.status(200).render("./folders/folderFiles", {
      elements: searchData,
      folder: folderData,
      pathArray: pathArray,
      areDestructiveActionsEnabled: true,
    });
  } catch (err) {
    next(err);
  }
}

async function deleteFolder(req, res, next) {
  try {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      req.flash("error", result.array());
      return res.redirect(dashboardRoute);
    }

    const data = matchedData(req);
    const userId = req.session.passport.user;
    const folderId = data.folder_id;
    const folder = await Folder.getFolder(folderId);

    if (!folder) {
      req.flash("error", "No folder found");
      return res.redirect(dashboardRoute);
    }

    if (folder.user_id !== userId) {
      req.flash("error", "You don't have access to this resource");
      return res.redirect(dashboardRoute);
    }

    const deletedFolder = await Folder.deleteFolder(folderId);
    const parentFolderId = deletedFolder.parent_folder_id;

    if (parentFolderId === null) {
      req.flash("success", "Folder deleted successfully");
      return res.redirect(dashboardRoute);
    }

    req.flash("success", "Folder deleted successfully");
    res.redirect(`/folder/files/${parentFolderId}`);
  } catch (err) {
    next(err);
  }
}

async function shareFolder(req, res, next) {
  try {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      const errors = result.array();
      const hasIdError = errors.some((error) => error.path === "folder_id");

      if (hasIdError) {
        req.flash("error", errors);
        return res.redirect(dashboardRoute);
      }

      const folderId = req.body.folder_id;
      const folder = await Folder.getFolder(folderId);
      const userId = req.session.passport.user;

      if (!folder) {
        req.flash("error", "Invalid folder");
        return res.redirect(dashboardRoute);
      }

      if (userId !== folder.user_id) {
        req.flash("error", "You can't share this folder");
        return res.redirect(dashboardRoute);
      }

      req.flash("error", errors);
      return res.redirect(
        folderId ? `/folder/files/${folderId}` : dashboardRoute,
      );
    }

    const reqData = matchedData(req);
    const folderHistory = await Folder.getFolderHistory(reqData.folder_id);
    const folderData = folderHistory[0];

    if (isSharedFolder(folderHistory)) {
      req.flash("error", "Folder has already been shared");

      if (folderData.folders.parent_folder_id === null) {
        return res.redirect(dashboardRoute);
      }

      return res.redirect(
        `/folder/files/${folderData.folders.parent_folder_id}`,
      );
    }

    const expirationDays = parseInt(reqData.expiration_days);
    const milisecondsPerDay = 24 * 60 * 60 * 1000;
    const expirationTimeMiliseconds =
      Date.now() + expirationDays * milisecondsPerDay;
    const expirationDate = new Date(expirationTimeMiliseconds);

    async function shareFolderRecursively(folderId) {
      const data = {
        user_id: req.session.passport.user,
        folder_id: parseInt(folderId),
        expires_at: expirationDate,
      };

      const folderElements = await Folder.getAllElements(folderId);

      await Folder.shareFolder(data);

      const folders = folderElements.filter((element) => element.type === "folder");
      const files = folderElements.filter((element) => element.type === "file").map((element) => {
        return {
          user_id: req.session.passport.user,
          file_id: element.file_id,
          expires_at: expirationDate,
        };
      });

      for(const file of files) {
        await File.shareFile(file);
      }

      for(const folder of folders) {
        await shareFolderRecursively(folder.folder_id);
      }
    }

    await shareFolderRecursively(reqData.folder_id);

    /*if ( === null) {
      req.flash("success", "Folder shared successfully");
      return res.redirect(dashboardRoute);
    }*/
   
    res.redirect(dashboardRoute)

    /*req.flash("success", "Folder shared successfully");
    res.redirect(`/folder/files/${folderData.folders.parent_folder_id}`);*/
  } catch (err) {
    next(err);
  }
}

async function getSharedFolder(req, res, next) {
  try {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      req.flash("error", result.array());
      return res.redirect(dashboardRoute);
    }

    const data = matchedData(req);
    const uuid = data.uuid;

    const sharedFolder = await Folder.findSharedFolder(uuid);
    const sharedFile = await Folder.findSharedFile(uuid);

    if (!sharedFolder && !sharedFile) {
      req.flash("error", "No resource was found");
      return res.redirect(dashboardRoute);
    }

    const isFolder = sharedFolder !== null && sharedFile === null;
    const owner = await User.getResourceOwner(isFolder, sharedFolder, sharedFile);
    const ownerFullName = owner.first_name + " " + owner.last_name;

    if (isFolder) {
      if (Date.now() > sharedFolder.expires_at.getTime()) {
        return res.redirect("/expired-link");
      }

      const rootData = await Folder.getAllElements(sharedFolder.folder_id);

      return res.status(200).render("./folders/sharedFolder", {
        elements: {
          rootData: rootData,
        },
        type: "folder",
        areDestructiveActionsEnabled: false,
        owner: ownerFullName,
        uuid: uuid,
      });
    } else if (!isFolder) {
      if (Date.now() > sharedFile.expires_at.getTime()) {
        return res.redirect("/expired-link");
      }

      const file = await File.getFileDetails(sharedFile.file_id);

      const formattedFile = {
        ...file,
        size: convertBytes(file.bytes),
      };

      return res.status(200).render("./folders/sharedFolder", {
        elements: formattedFile,
        type: "file",
        areDestructiveActionsEnabled: false,
        owner: ownerFullName,
        uuid: uuid,
      });
    }
  } catch (err) {
    next(err);
  }
}

async function getUpdateFolderView(req, res, next) {
  try {
    const result = validationResult(req);
    const userId = req.session.passport.user;

    if (!result.isEmpty()) {
      req.flash("error", result.array());
      return res.redirect(dashboardRoute);
    }

    const reqData = matchedData(req);
    const folderId = parseInt(reqData.folder_id);
    const folder = await Folder.getFolder(folderId);

    if (!folder) {
      req.flash("error", "No folder was found");
      return res.redirect(dashboardRoute);
    }

    if (userId !== folder.user_id) {
      req.flash("error", "You don't have access to this folder");
      return res.redirect(dashboardRoute);
    }

    const data = {
      folder_id: folder.folder_id,
      folder_name: folder.folder_name,
    };

    res.status(200).render("./folders/updateFolderName", { folder: data });
  } catch (err) {
    next(err);
  }
}

async function updateFolderName(req, res, next) {
  try {
    const folderId = Number(req.body.folder_id);
    const result = validationResult(req);

    if (!result.isEmpty()) {
      const errors = result.array();
      req.flash("error", errors);

      const hasFolderIdError = errors.some(
        (error) => error.path === "folder_id",
      );

      if (!hasFolderIdError && Number.isInteger(folderId)) {
        return res.redirect(`/folder/update/${folderId}`);
      }

      return res.redirect(dashboardRoute);
    }

    const data = matchedData(req);
    const userId = req.session.passport.user;
    const folder = await Folder.getFolder(userId);

    if (userId !== folder.user_id) {
      req.error("error", "You cannot update this folder");
      return res.redirect(dashboardRoute);
    }

    const updatedFolder = await Folder.updateFolderName(data);

    if (updatedFolder.parent_folder_id === null) {
      req.flash("success", "Folder updated successfully");
      return res.redirect(dashboardRoute);
    }

    req.flash("success", "Folder updated successfully");
    res.redirect(`/folder/files/${updatedFolder.parent_folder_id}`);
  } catch (err) {
    next(err);
  }
}

async function downloadFolder(req, res, next) {
  try {
    const r = validationResult(req);

    if (!r.isEmpty()) {
      req.flash("error", r.array());
      return res.redirect(dashboardRoute);
    }

    const data = matchedData(req);
    const folderId = parseInt(data.folder_id);
    const folder = await Folder.getFolder(folderId);

    if (!folder) {
      req.flash("error", "No folder found");
      return res.redirect(dashboardRoute);
    }

    const size = await Folder.calculateSize(folder);

    if (size < 1) {
      req.flash("error", "An empty folder cannot be downloaded");
      return res.redirect(
        folder.parent_folder_id
          ? `/folder/files/${folder.parent_folder_id}`
          : dashboardRoute,
      );
    }

    const folderName = folder.folder_name;
    const uuid = randomUUID();
    await recreateFolder(folderId, "./", uuid);
    await zip(`./${uuid}`, `./${uuid}.zip`);

    res.download(`./${uuid}.zip`, `${folder.folder_name}.zip`, async (err) => {
      if (err) {
        console.error(err);
        throw err;
      }

      // Delete folders after the download
      rm(`./${uuid}`, { recursive: true }, (err) => {
        if (err) {
          console.error(err);
          throw err;
        }
      });

      rm(`./${uuid}.zip`, { recursive: false }, (err) => {
        if (err) {
          console.error(err);
          throw err;
        }
      });
    });
  } catch (err) {
    next(err);
  }
}

async function downloadSharedFolder(req, res, next) {
  try {
    const uuid = req.params.uuid;
    const folder = await Folder.findSharedFolder(uuid);
    res.redirect(`/folder/download/${folder.folder_id}`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createFolder,
  getAllFolderElements,
  deleteFolder,
  shareFolder,
  getSharedFolder,
  updateFolderName,
  getUpdateFolderView,
  downloadFolder,
  downloadSharedFolder,
};
