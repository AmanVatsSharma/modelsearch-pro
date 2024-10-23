import { PrismaClient } from "@prisma/client";

let prisma;

// In production, this code will only run once per instance
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // In development, create a new instance for each request to prevent memory leaks
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["query", "error", "warn"],
    });
  }
  prisma = global.prisma;
}

export { prisma };
