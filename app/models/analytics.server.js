import { prisma } from "~/db.server.js";

// Search Log functions
export async function createSearchLog(data) {
  return prisma.searchLog.create({
    data,
  });
}

export async function getSearchLogs(shop, { startDate, endDate, page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  
  const where = { shop };
  
  if (startDate || endDate) {
    where.createdAt = {};
    
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }
  
  const [logs, count] = await Promise.all([
    prisma.searchLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.searchLog.count({ where }),
  ]);
  
  return {
    logs,
    pagination: {
      page,
      pageSize: limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getSearchStats(shop, { startDate, endDate } = {}) {
  const where = { shop };
  
  if (startDate || endDate) {
    where.createdAt = {};
    
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }
  
  const totalSearches = await prisma.searchLog.count({ where });
  
  const successfulSearches = await prisma.searchLog.count({
    where: {
      ...where,
      successful: true,
    },
  });
  
  const topMakes = await prisma.searchLog.groupBy({
    by: ["makeId"],
    where: {
      ...where,
      makeId: { not: null },
    },
    _count: {
      makeId: true,
    },
    orderBy: {
      _count: {
        makeId: "desc",
      },
    },
    take: 10,
  });
  
  const topModels = await prisma.searchLog.groupBy({
    by: ["modelId"],
    where: {
      ...where,
      modelId: { not: null },
    },
    _count: {
      modelId: true,
    },
    orderBy: {
      _count: {
        modelId: "desc",
      },
    },
    take: 10,
  });
  
  return {
    totalSearches,
    successfulSearches,
    successRate: totalSearches > 0 ? (successfulSearches / totalSearches) * 100 : 0,
    topMakes,
    topModels,
  };
}

// Product View functions
export async function createProductView(data) {
  return prisma.productView.create({
    data,
  });
}

export async function getProductViews(shop, { startDate, endDate, page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  
  const where = { shop };
  
  if (startDate || endDate) {
    where.createdAt = {};
    
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }
  
  const [views, count] = await Promise.all([
    prisma.productView.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.productView.count({ where }),
  ]);
  
  return {
    views,
    pagination: {
      page,
      pageSize: limit,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
    },
  };
}

export async function getTopViewedProducts(shop, { startDate, endDate, limit = 10 } = {}) {
  const where = { shop };
  
  if (startDate || endDate) {
    where.createdAt = {};
    
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    
    if (endDate) {
      where.createdAt.lte = new Date(endDate);
    }
  }
  
  return prisma.productView.groupBy({
    by: ["productId"],
    where,
    _count: {
      productId: true,
    },
    orderBy: {
      _count: {
        productId: "desc",
      },
    },
    take: limit,
  });
} 