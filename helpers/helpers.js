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

module.exports = {
  convertBytes,
  isSharedFolder,
};
