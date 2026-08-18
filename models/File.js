const prisma = require("../lib/prisma");

class File {
  static async createFile(data) {
    await prisma.files.create({
      data: data,
    });
  }

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

  static async getSharedFileHistory(fileId) {
    const fileHistory = await prisma.shared_files.findMany({
      where: {
        file_id: parseInt(fileId)
      },
      include: {
        files: {
          select: {
            folder_id: true,
          }
        }
      }
    });

    return fileHistory;
  }

  static async shareFile(fileData) {
    const sharedFile = await prisma.shared_files.create({
      data: fileData,
      include: {
        files: {
          select: {
            folder_id: true,
          },
        },
      },
    });

    return sharedFile;
  }

  static async getSharedFiles(userId) {}
}

module.exports = File;
