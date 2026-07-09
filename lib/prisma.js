const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../generated/prisma/client");

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({ connectionString: connectionString });
const prisma = new PrismaClient({ adapter: adapter });

module.exports = prisma;
