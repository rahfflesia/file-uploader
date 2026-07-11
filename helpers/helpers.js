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

module.exports = {
  convertBytes,
};
