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

export async function getSearchStats(shop, daysCount = 7) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysCount);
  
  // Generate array of dates for the last N days
  const dates = [];
  for (let i = 0; i < daysCount; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // Get search logs for the date range
  const searchLogs = await prisma.searchLog.findMany({
    where: {
      shop,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      successful: true,
    },
  });
  
  // Group by date
  const stats = dates.map(date => {
    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const dayLogs = searchLogs.filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate >= dayStart && logDate < dayEnd;
    });
    
    const successful = dayLogs.filter(log => log.successful).length;
    
    return {
      date,
      count: dayLogs.length,
      successful,
    };
  });
  
  return stats;
}

export async function getRecentSearches(shop, limit = 10) {
  return prisma.searchLog.findMany({
    where: {
      shop,
    },
    select: {
      id: true,
      makeId: true,
      modelId: true,
      yearId: true,
      submodelId: true,
      searchResults: true,
      successful: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
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