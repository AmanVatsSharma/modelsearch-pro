import { prisma } from "~/db.server.js";

export async function createImportJob(data) {
  return prisma.importJob.create({
    data,
  });
}

export async function getImportJob(id) {
  return prisma.importJob.findUnique({
    where: { id },
  });
}

export async function updateImportJob(id, data) {
  return prisma.importJob.update({
    where: { id },
    data,
  });
}

export async function getImportJobs(shop, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  
  const [jobs, count] = await Promise.all([
    prisma.importJob.findMany({
      where: { shop },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.importJob.count({ where: { shop } }),
  ]);
  
  return {
    jobs,
    pagination: {
      page,
      pageSize: limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getPendingImportJobs(shop) {
  return prisma.importJob.findMany({
    where: {
      shop,
      status: "pending",
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getProcessingImportJobs(shop) {
  return prisma.importJob.findMany({
    where: {
      shop,
      status: "processing",
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function markImportJobComplete(id, { processedRows, errorRows = 0, errorLog = null } = {}) {
  return prisma.importJob.update({
    where: { id },
    data: {
      status: "completed",
      processedRows,
      errorRows,
      errorLog,
      completedAt: new Date(),
    },
  });
}

export async function markImportJobFailed(id, errorLog) {
  return prisma.importJob.update({
    where: { id },
    data: {
      status: "failed",
      errorLog,
      completedAt: new Date(),
    },
  });
}

export async function deleteImportJob(id) {
  return prisma.importJob.delete({
    where: { id },
  });
} 