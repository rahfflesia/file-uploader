const prisma = require("../lib/prisma");

class Folder {
  static async createFolder(folderData) {
    await prisma.folders.create({
      data: folderData,
    });
  }

  static async getAllUserFolders(userId) {
    const folders = await prisma.folders.findMany({
      where: {
        user_id: userId,
      },
      include: {
        files: {
          select: {
            bytes: true,
          },
        },
      },
    });
    return folders;
  }

  static async getAllFolderFiles(folderId) {
    const files = await prisma.files.findMany({
      where: {
        folder_id: parseInt(folderId),
      },
    });
    return files;
  }

  static async deleteFolder(folderId) {
    await prisma.$transaction(async (tx) => {
      const id = parseInt(folderId);
      await tx.files.deleteMany({
        where: {
          folder_id: id,
        },
      });

      await tx.shared_folders.deleteMany({
        where: {
          folder_id: id,
        },
      });

      await tx.folders.delete({
        where: {
          folder_id: id,
        },
      });
    });
  }

  static async getFolder(folderId) {
    const folder = await prisma.folders.findUnique({
      where: {
        folder_id: parseInt(folderId),
      },
    });
    return folder;
  }

  static async updateFolderName(folderData) {
    await prisma.folders.update({
      data: {
        folder_name: folderData.folder_name,
      },
      where: {
        folder_id: parseInt(folderData.folder_id),
      },
    });
  }
}

module.exports = Folder;
