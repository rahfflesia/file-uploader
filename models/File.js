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

  static async updateFileName(fileData) {
    const updatedFile = await prisma.files.update({
      data: {
        file_name: fileData.file_name,
      },
      where: {
        file_id: parseInt(fileData.file_id),
      },
    });
    return updatedFile;
  }

  static async shareFile() {}

  static async getSharedFiles(userId) {}
}

module.exports = File;
