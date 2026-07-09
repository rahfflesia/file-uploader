const prisma = require("../lib/prisma");

class File {
  static async deleteFile(fileId) {
    const deletedFile = await prisma.files.delete({
      where: {
        file_id: parseInt(fileId),
      },
    });
    return deletedFile;
  }

  static async getFileDetails(fileId) {
    const file = await prisma.files.findUnique({
      where: {
        file_id: parseInt(fileId),
      },
    });
    return file;
  }
}

module.exports = File;
