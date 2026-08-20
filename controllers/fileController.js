const File = require("../models/File");
const Folder = require("../models/Folder");
const cloudinary = require("cloudinary").v2;
const { convertBytes, isSharedFile } = require("../helpers/helpers");
const { validationResult, matchedData } = require("express-validator");
const { randomUUID } = require("node:crypto");
const fs = require("fs");
const { Readable } = require("node:stream");
const { finished } = require("node:stream/promises");
const { rm } = require("node:fs");

const dashboardRoute = "/dashboard";

async function deleteFile(req, res, next) {
  try {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      req.flash("error", result.array());
      return res.redirect(dashboardRoute);
    }

    const userId = req.session.passport.user;
    const data = matchedData(req);
    const fileId = data.file_id;

    const file = await File.getFileDetails(fileId);

    if (!file) {
      req.flash("error", "No file was found");
      return res.redirect(dashboardRoute);
    }

    if (userId !== file.user_id) {
      req.flash("error", "You don't have the permissions to delete this file");
      return res.redirect();
    }

    const deletedFile = await File.deleteFile(fileId);
    await cloudinary.uploader.destroy(deletedFile.cloudinary_public_id, {
      resource_type: deletedFile.cloudinary_resource_type,
      invalidate: true,
    });

    if (deletedFile.folder_id === null) {
      req.flash("success", "File deleted successfully");
      return res.redirect(dashboardRoute);
    }

    req.flash("success", "File deleted successfully");
    res.redirect(`/folder/files/${deletedFile.folder_id}`);
  } catch (err) {
    next(err);
  }
}

async function getFileDetails(req, res, next) {
  try {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      req.flash("error", result.array());
      return res.redirect(dashboardRoute);
    }

    const data = matchedData(req);

    const userId = req.session.passport.user;
    const fileId = data.file_id;
    const file = await File.getFileDetails(fileId);

    if (!file) {
      req.flash("error", "No file was found");
      return res.redirect(dashboardRoute);
    }

    if (userId !== file.user_id) {
      req.flash("error", "You don't have the permissions to view this file");
      return res.redirect(dashboardRoute);
    }

    const formatedFile = {
      ...file,
      size: convertBytes(file.bytes),
    };

    res.status(200).render("./files/fileDetails", { file: formatedFile });
  } catch (err) {
    next(err);
  }
}

async function getUpdateFileNameView(req, res, next) {
  try {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      req.flash("error", result.array());
      return res.redirect(dashboardRoute);
    }

    const data = matchedData(req);
    const fileId = data.file_id;
    const file = await File.getFileDetails(fileId);
    const userId = req.session.passport.user;

    if (!file) {
      req.flash("error", "No folder was found");
      return res.redirect(dashboardRoute);
    }

    if (userId !== file.user_id) {
      req.flash("error", "You don't have the permissions to view this file");
      return res.redirect(dashboardRoute);
    }

    res.status(200).render("./files/updateFileName", { file: file });
  } catch (err) {
    next(err);
  }
}

async function updateFileName(req, res, next) {
  try {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      const errors = result.array();
      const hasErrorId = errors.some((error) => error.path === "file_id");

      if (hasErrorId) {
        req.flash("error", errors);
        return res.redirect(dashboardRoute);
      }

      const fileId = Number(req.body.file_id);
      const file = await File.getFileDetails(fileId);
      const userId = req.session.passport.user;

      if (!file) {
        req.flash("error", "No file found");
        return res.redirect(dashboardRoute);
      }

      if (userId !== file.user_id) {
        req.flash(
          "error",
          "You don't have the permissions to update this file",
        );
        return res.redirect(dashboardRoute);
      }

      req.flash("error", errors);
      return res.redirect(`/file/update/${fileId}`);
    }

    const data = matchedData(req);
    const updatedFile = await File.updateFileName(data);

    if (updatedFile.folder_id === null) {
      return res.status(200).redirect(dashboardRoute);
    }

    res.status(200).redirect(`/folder/files/${updatedFile.folder_id}`);
  } catch (err) {
    next(err);
  }
}

async function shareFile(req, res, next) {
  try {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      const errors = result.array();
      const hasIdError = errors.some((error) => error.path === "file_id");

      if (hasIdError) {
        req.flash("error", errors);
        return res.redirect(dashboardRoute);
      }

      const fileId = req.body.file_id;
      const file = await File.getFileDetails(fileId);
      const userId = req.session.passport.user;

      if (!file) {
        req.flash("error", "No file was found");
        return res.redirect(dashboardRoute);
      }

      if (userId !== file.user_id) {
        req.flash("error", "You can't share this file");
        return res.redirect(dashboardRoute);
      }

      return res.redirect(
        file.folder_id ? `/folder/files/${fileId}` : dashboardRoute,
      );
    }

    const reqData = matchedData(req);
    const fileId = reqData.file_id;
    const fileHistory = await File.getSharedFileHistory(fileId);

    if (isSharedFile(fileHistory)) {
      const fileData = fileHistory[0];
      req.flash("error", "File has already been shared");
      return res.redirect(
        fileData.files.folder_id
          ? `/folder/files/${fileData.files.folder_id}`
          : dashboardRoute,
      );
    }

    const expirationDays = parseInt(reqData.expiration_days);
    const milisecondsPerDay = 24 * 60 * 60 * 1000;
    const expirationTimeMiliseconds =
      Date.now() + expirationDays * milisecondsPerDay;
    const expirationDate = new Date(expirationTimeMiliseconds);

    const data = {
      user_id: req.session.passport.user,
      file_id: fileId,
      expires_at: expirationDate,
    };

    const sharedFile = await File.shareFile(data);

    if (sharedFile.files.folder_id === null) {
      req.flash("success", "File shared successfully");
      return res.redirect(dashboardRoute);
    }

    req.flash("success", "File shared successfully");
    res.redirect(`/folder/files/${sharedFile.files.folder_id}`);
  } catch (err) {
    next(err);
  }
}

async function uploadFile(req, res, next) {
  try {
    const r = validationResult(req);
    const userId = req.session.passport.user;

    if (!req.file || req.file.buffer.length < 1) {
      req.flash("error", "You are trying to upload an empty file");
      return res.redirect(dashboardRoute);
    }

    if (!r.isEmpty()) {
      req.flash("error", r.array());
      return res.redirect(dashboardRoute);
    }

    const data = matchedData(req);
    const folderId = data.folder_id ? parseInt(data.folder_id) : null;

    if (folderId) {
      const folder = await Folder.getFolder(folderId);

      if (!folder) {
        req.flash("error", "Invalid folder");
        return res.redirect(dashboardRoute);
      }

      if (userId !== folder.user_id) {
        req.flash("error", "You can't upload files to this folder");
        return res.redirect(dashboardRoute);
      }
    }

    const mb = 1048576;
    // Max size is 100mb for video, for everything else is 10mb
    if (
      (!req.file.mimetype.includes("video") &&
        req.file.buffer.length > mb * 10) ||
      (req.file.mimetype.includes("video") && req.file.buffer.length > mb * 100)
    ) {
      req.flash(
        "error",
        "The file is too large (100 MB Max for video and 10 MB for other type of files)",
      );
      return res.redirect(
        folderId ? `/folder/files/${folderId}` : dashboardRoute,
      );
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
      mime_type: req.file.mimetype,
      user_id: userId,
    };

    await File.createFile(fileData);

    if (folderId === null) {
      req.flash("success", "File uploaded successfully");
      return res.status(201).redirect(dashboardRoute);
    }

    req.flash("success", "File uploaded successfully");
    res.status(201).redirect(`/folder/files/${folderId}`);
  } catch (err) {
    next(err);
  }
}

async function downloadFile(req, res, next) {
  try {
    const r = validationResult(req);

    if (!r.isEmpty()) {
      req.flash("error", r.array());
      return res.redirect(dashboardRoute);
    }

    const data = matchedData(req);
    const fileId = data.file_id;
    const file = await File.getFileDetails(fileId);

    if (!file) {
      req.flash("error", "No file was found");
      return res.redirect(dashboardRoute);
    }

    if (file.bytes < 1) {
      req.flash("error", "Empty files cannot be downloaded");
      return res.redirect(
        file.folder_id ? `/folder/files/${file.folder_id}` : dashboardRoute,
      );
    }

    const fileName = file.file_name;
    const uuid = randomUUID();

    try {
      const stream = fs.createWriteStream(`./${uuid}`);
      const { body } = await fetch(file.url);
      await finished(Readable.fromWeb(body).pipe(stream));
    } catch (err) {
      throw err;
    }

    res.download(`./${uuid}`, `./${fileName}`, (err) => {
      if (err) {
        console.error(err);
        throw err;
      }

      rm(`./${uuid}`, (err) => {
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

module.exports = {
  deleteFile,
  getFileDetails,
  getUpdateFileNameView,
  updateFileName,
  shareFile,
  uploadFile,
  downloadFile,
};
