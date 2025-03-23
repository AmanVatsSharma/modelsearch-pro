import { prisma } from "~/db.server.js";

export async function getSettings(shop) {
  return await prisma.settings.findUnique({
    where: { shop },
  });
}

export async function createSettings(data) {
  return prisma.settings.create({
    data,
  });
}

export async function updateSettings(shop, data) {
  return await prisma.settings.upsert({
    where: { shop },
    update: data,
    create: {
      shop,
      ...data,
    },
  });
} 