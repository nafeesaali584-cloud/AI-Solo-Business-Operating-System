import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is SQLite compatible in case legacy postgresql URL is set in Hostinger environment
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
  process.env.DATABASE_URL = "file:./prisma/dev.db";
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

global.prisma = db;
