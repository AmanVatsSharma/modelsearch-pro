import { prisma } from "~/db.server.js";

export async function getProducts(shop, { page = 1, limit = 20, search = "" } = {}) {
  const skip = (page - 1) * limit;
  
  const where = { shop };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { handle: { contains: search, mode: "insensitive" } },
    ];
  }
  
  const [products, count] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        _count: {
          select: { fitments: true },
        },
      },
      orderBy: { title: "asc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);
  
  return {
    products,
    pagination: {
      page,
      pageSize: limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getProduct(id, shop) {
  return prisma.product.findUnique({
    where: { id, shop },
    include: {
      fitments: {
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
      },
    },
  });
}

export async function getProductByHandle(handle, shop) {
  return prisma.product.findFirst({
    where: { handle, shop },
    include: {
      fitments: {
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
      },
    },
  });
}

export async function createProduct(data) {
  return prisma.product.create({
    data,
  });
}

export async function updateProduct(id, shop, data) {
  return prisma.product.update({
    where: { id, shop },
    data,
  });
}

export async function deleteProduct(id, shop) {
  return prisma.product.delete({
    where: { id, shop },
  });
}

export async function upsertProduct(data) {
  return prisma.product.upsert({
    where: { id: data.id },
    update: data,
    create: data,
  });
}

export async function getCompatibleProducts(shop, makeId, modelId, yearId, submodelId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  
  const where = {
    shop,
    fitments: {
      some: {
        yearId,
        ...(submodelId ? { submodelId } : {}),
      },
    },
  };
  
  const [products, count] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { title: "asc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);
  
  return {
    products,
    pagination: {
      page,
      pageSize: limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getTotalProducts(shop) {
  return prisma.product.count({
    where: { shop }
  });
} 