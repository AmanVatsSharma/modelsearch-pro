import { prisma } from "~/db.server.js";

export async function getSettings(shop) {
  const settings = await prisma.settings.findUnique({
    where: { shop },
  });
  
  if (!settings) {
    return createSettings({ shop });
  }
  
  return settings;
}

export async function createSettings(data) {
  return prisma.settings.create({
    data,
  });
}

export async function updateSettings(shop, data) {
  return prisma.settings.upsert({
    where: { shop },
    update: data,
    create: { shop, ...data },
  });
} 