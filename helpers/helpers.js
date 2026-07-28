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

function isSharedFile(filesArray) {
  for (const file of filesArray) {
    if (Date.now() < file.expires_at.getTime()) {
      return true;
    }
  }

  return false;
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
  getFilesBytes,
  getFolderBytes,
  isSharedFile,
};
