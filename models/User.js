const prisma = require("../lib/prisma");

class User {
  static async createUser(userData) {
    await prisma.users.create({
      data: userData,
    });
  }

  static async findUserByEmail(email) {
    const user = await prisma.users.findUnique({
      where: {
        email: email,
      },
    });
    return user;
  }

  static async findUserById(userId) {
    const user = await prisma.users.findUnique({
      where: {
        user_id: userId,
      },
    });
    return user;
  }

  static async getResourceOwner(isFolder) {
    const owner = await prisma.users.findUnique({
      where: {
        user_id: isFolder ? sharedFolder.user_id : sharedFile.user_id,
      },
      select: {
        first_name: true,
        last_name: true,
      },
    });

    return owner;
  }
}

module.exports = User;
