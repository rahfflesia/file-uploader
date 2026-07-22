const prisma = require("../lib/prisma");
const {
  convertBytes,
  formatFiles,
  formatFolders,
  getFilesBytes,
  getFolderBytes,
} = require("../helpers/helpers");

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

  static async getAllRootElements(id) {
    const userId = parseInt(id);
    const files = await prisma.files.findMany({
      where: {
        folder_id: null,
        user_id: userId,
      },
    });

    const folders = await prisma.folders.findMany({
      where: {
        parent_folder_id: null,
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

    const formattedFiles = formatFiles(files);
    const formattedFolders = await formatFolders(folders);
    const filesBytes = getFilesBytes(files);
    const folderBytes = getFolderBytes(folders);
    const usedStorage = filesBytes + folderBytes;

    const rootElements = [...formattedFiles, ...formattedFolders];
    const formattedStorage = convertBytes(usedStorage);

    return { rootElements, formattedStorage };
  }

  static async getAllElements(id) {
    const folderId = parseInt(id);
    const childFolders = await prisma.folders.findMany({
      where: {
        parent_folder_id: folderId,
      },
      include: {
        files: {
          select: {
            bytes: true,
          },
        },
      },
    });

    const files = await prisma.files.findMany({
      where: {
        folder_id: folderId,
      },
    });

    const formattedChildFolders = await formatFolders(childFolders);
    const formattedFiles = formatFiles(files);
    const folderElements = [...formattedChildFolders, ...formattedFiles];

    return folderElements;
  }
}

module.exports = Folder;
