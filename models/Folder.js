const prisma = require("../lib/prisma");
const {
  convertBytes,
  getFilesBytes,
  getFolderBytes,
} = require("../helpers/helpers");
const cloudinary = require("cloudinary").v2;

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
    const deleteFilesRecursively = async (folderId) => {
      const children = await this.getAllFolderChilds(folderId);
      const files = await this.getAllFolderFiles(folderId);

      if (files.length === 0 && children.length === 0) {
        return;
      }

      for (const child of children) {
        await deleteFilesRecursively(child.folder_id);
      }

      for (const file of files) {
        await cloudinary.uploader.destroy(file.cloudinary_public_id, {
          resource_type: file.cloudinary_resource_type,
          invalidate: true,
        });
      }
    };

    const id = parseInt(folderId);

    await deleteFilesRecursively(id);

    const deletedFolder = await prisma.folders.delete({
      where: {
        folder_id: id,
      },
    });

    return deletedFolder;
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
    const folder = await prisma.folders.update({
      data: {
        folder_name: folderData.folder_name,
      },
      where: {
        folder_id: parseInt(folderData.folder_id),
      },
    });

    return folder;
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

    const formattedFiles = await this.formatFiles(files);
    const formattedFolders = await this.formatFolders(foldersWithChilds);
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

    const formattedChildFolders = await this.formatFolders(childFolders);
    const formattedFiles = await this.formatFiles(files);
    const folderElements = [...formattedChildFolders, ...formattedFiles];

    return folderElements;
  }

  static async calculateSize(folder) {
    const id = folder.folder_id;
    const files = await Folder.getAllFolderFiles(id);
    const children = await Folder.getAllFolderChilds(id);

    if (children.length === 0 && files.length === 0) {
      return 0;
    }

    let totalSize = 0;
    for (const child of children) {
      totalSize += await this.calculateSize(child);
    }

    for (const file of files) {
      totalSize += file.bytes;
    }

    return totalSize;
  }

  static async formatFiles(files) {
    const formattedFiles = await Promise.all(
      files.map(async (file) => {
        const fileHistory = await prisma.shared_files.findMany({
          where: {
            file_id: file.file_id,
          },
        });

        let linkUUID = null;
        for (const data of fileHistory) {
          if (Date.now() <= data.expires_at.getTime()) {
            linkUUID = data.link_uuid;
          }
        }

        return {
          ...file,
          type: "file",
          size: convertBytes(file.bytes),
          share_link:
            linkUUID !== null
              ? `http://localhost:8080/folder/share/${linkUUID}`
              : linkUUID,
        };
      }),
    );
    return formattedFiles;
  }

  static async formatFolders(folder) {
    const formattedFolders = await Promise.all(
      folder.map(async (folder) => {
        let size = await this.calculateSize(folder);

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
          size: convertBytes(size),
          share_link:
            linkUUID !== null
              ? `http://192.168.100.8:8080/folder/share/${linkUUID}`
              : linkUUID,
        };
      }),
    );
    return formattedFolders;
  }

  static async findSharedFolder(uuid) {
    const sharedFolder = await prisma.shared_folders.findUnique({
      where: {
        link_uuid: uuid,
      },
    });

    return sharedFolder;
  }

  static async findSharedFile(uuid) {
    const sharedFile = await prisma.shared_files.findUnique({
      where: {
        link_uuid: uuid,
      },
    });

    return sharedFile;
  }

  static async getFolderHistory(folderId) {
    const folderHistory = await prisma.shared_folders.findMany({
      where: {
        folder_id: parseInt(folderId),
      },
      include: {
        folders: {
          select: {
            parent_folder_id: true,
          },
        },
      },
    });

    return folderHistory;
  }

  static async shareFolder(data) {
    const sharedFolder = await prisma.shared_folders.create({
      data: data,
      include: {
        folders: {
          select: {
            parent_folder_id: true,
          },
        },
      },
    });

    return sharedFolder;
  }
}

module.exports = Folder;
