import { prisma } from "~/db.server.js";

export async function getFitments(productId) {
  return prisma.fitment.findMany({
    where: { productId },
    include: {
      year: {
        include: {
          model: {
            include: {
              make: true,
            },
          },
        },
      },
      submodel: true,
    },
    orderBy: [
      { year: { model: { make: { name: "asc" } } } },
      { year: { model: { name: "asc" } } },
      { year: { value: "desc" } },
      { submodel: { name: "asc" } },
    ],
  });
}

export async function getFitment(id) {
  return prisma.fitment.findUnique({
    where: { id },
    include: {
      year: {
        include: {
          model: {
            include: {
              make: true,
            },
          },
        },
      },
      submodel: true,
      product: true,
    },
  });
}

export async function createFitment(data) {
  return prisma.fitment.create({
    data,
    include: {
      year: {
        include: {
          model: {
            include: {
              make: true,
            },
          },
        },
      },
      submodel: true,
    },
  });
}

export async function updateFitment(id, data) {
  return prisma.fitment.update({
    where: { id },
    data,
    include: {
      year: {
        include: {
          model: {
            include: {
              make: true,
            },
          },
        },
      },
      submodel: true,
    },
  });
}

export async function deleteFitment(id) {
  return prisma.fitment.delete({
    where: { id },
  });
}

export async function bulkCreateFitments(data) {
  return prisma.fitment.createMany({
    data,
    skipDuplicates: true,
  });
}

export async function deleteProductFitments(productId) {
  return prisma.fitment.deleteMany({
    where: { productId },
  });
}

export async function checkFitmentExists(productId, yearId, submodelId) {
  const where = {
    productId,
    yearId,
  };
  
  if (submodelId) {
    where.submodelId = submodelId;
  } else {
    where.submodelId = null;
  }
  
  return prisma.fitment.findFirst({
    where,
  });
}

export async function getTotalFitments(shop) {
  return prisma.fitment.count({
    where: {
      product: {
        shop
      }
    }
  });
} 