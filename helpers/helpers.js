const prisma = require("../lib/prisma");

function convertBytes(bytes) {
  let counter = 0;

  if (bytes >= 1024) {
    while (bytes >= 1024) {
      bytes /= 1024;
      counter++;
    }

    const units = {
      1: "KB",
      2: "MB",
      3: "GB",
      4: "TB",
    };

    return `${bytes.toFixed(2)} ${units[counter]}`;
  }

  return `${bytes} B`;
}

function isSharedFolder(arr) {
  for (const folder of arr) {
    if (Date.now() < folder.expires_at.getTime()) {
      return true;
    }
  }
  return false;
}

function formatFiles(filesArray) {
  const formattedFiles = filesArray.map((file) => {
    return {
      ...file,
      type: "file",
      size: convertBytes(file.bytes),
    };
  });
  return formattedFiles;
}

async function formatFolders(foldersArray) {
  const formattedFolders = await Promise.all(
    foldersArray.map(async (folder) => {
      let totalSize = folder.files.reduce((total, current) => {
        return total + current.bytes;
      }, 0);

      const folderHistory = await prisma.shared_folders.findMany({
        where: {
          folder_id: folder.folder_id,
        },
      });

      let linkUUID = null;
      for (const data of folderHistory) {
        // Found a not expired link
        if (Date.now() <= data.expires_at.getTime()) {
          linkUUID = data.link_uuid;
        }
      }

      return {
        ...folder,
        type: "folder",
        size: convertBytes(totalSize),
        share_link:
          linkUUID !== null
            ? `http://localhost:8080/folder/share/${linkUUID}`
            : linkUUID,
      };
    }),
  );
  return formattedFolders;
}

function getFilesBytes(filesArray) {
  let bytes = 0;
  filesArray.forEach((file) => {
    bytes += file.bytes;
  });
  return bytes;
}

function getFolderBytes(foldersArray) {
  let bytes = 0;
  foldersArray.forEach((folder) => {
    let totalSize = folder.files.reduce((total, current) => {
      return total + current.bytes;
    }, 0);
    bytes += totalSize;
  });
  return bytes;
}

module.exports = {
  convertBytes,
  isSharedFolder,
  formatFiles,
  formatFolders,
  getFilesBytes,
  getFolderBytes,
};
