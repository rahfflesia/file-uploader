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
}

module.exports = User;
