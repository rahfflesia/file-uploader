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
      await prisma.folders.delete({
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

  static async getAllFolderChilds(folderId) {
    const childs = await prisma.folders.findMany({
      where: {
        parent_folder_id: parseInt(folderId),
      },
      include: {
        files: {
          select: {
            bytes: true,
            file_name: true,
            url: true,
          },
        },
      },
    });
    return childs;
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
            file_name: true,
            url: true,
          },
        },
      },
    });

    const recurse = async (folder) => {
      const childs = await this.getAllFolderChilds(folder.folder_id);

      if (childs.length === 0) {
        return {
          ...folder,
          childs: [],
        };
      }

      let arr = [];
      for (const c of childs) {
        const r = await recurse(c);
        arr.push(r);
      }

      return {
        ...folder,
        childs: arr,
      };
    };

    const foldersWithChilds = await Promise.all(folders.map(await recurse));

    const formattedFiles = formatFiles(files);
    const formattedFolders = await formatFolders(foldersWithChilds);
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
            url: true,
            file_name: true,
          },
        },
        folders: {
          select: {
            folder_name: true,
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
