import { prisma } from "~/db.server.js";

// Fallback data to use when database is not ready
const FALLBACK_MODELS = {
  ford: [
    { id: "f150", name: "F-150", makeId: "ford" },
    { id: "mustang", name: "Mustang", makeId: "ford" },
    { id: "escape", name: "Escape", makeId: "ford" }
  ],
  toyota: [
    { id: "camry", name: "Camry", makeId: "toyota" },
    { id: "corolla", name: "Corolla", makeId: "toyota" },
    { id: "rav4", name: "RAV4", makeId: "toyota" }
  ],
  honda: [
    { id: "civic", name: "Civic", makeId: "honda" },
    { id: "accord", name: "Accord", makeId: "honda" },
    { id: "crv", name: "CR-V", makeId: "honda" }
  ],
  chevrolet: [
    { id: "silverado", name: "Silverado", makeId: "chevrolet" },
    { id: "malibu", name: "Malibu", makeId: "chevrolet" },
    { id: "equinox", name: "Equinox", makeId: "chevrolet" }
  ],
  bmw: [
    { id: "3series", name: "3 Series", makeId: "bmw" },
    { id: "5series", name: "5 Series", makeId: "bmw" },
    { id: "x5", name: "X5", makeId: "bmw" }
  ],
  mercedes: [
    { id: "cclass", name: "C-Class", makeId: "mercedes" },
    { id: "eclass", name: "E-Class", makeId: "mercedes" },
    { id: "glesuv", name: "GLE SUV", makeId: "mercedes" }
  ],
  audi: [
    { id: "a4", name: "A4", makeId: "audi" },
    { id: "a6", name: "A6", makeId: "audi" },
    { id: "q5", name: "Q5", makeId: "audi" }
  ],
  nissan: [
    { id: "altima", name: "Altima", makeId: "nissan" },
    { id: "sentra", name: "Sentra", makeId: "nissan" },
    { id: "rogue", name: "Rogue", makeId: "nissan" }
  ]
};

// Get all models for a specific make
export async function getModels(shop, makeId) {
  try {
    // First try to get from database
    const models = await prisma.model.findMany({
      where: { makeId },
      orderBy: { name: "asc" },
    });
    
    console.log(`Retrieved ${models.length} models from database for make: ${makeId}`);
    return models;
  } catch (error) {
    // If database query fails, use fallback data
    console.warn(`Error fetching models for make ${makeId}: ${error.message}. Using fallback data.`);
    return FALLBACK_MODELS[makeId] || [];
  }
}

// Get a specific model by ID
export async function getModel(id) {
  try {
    return await prisma.model.findUnique({
      where: { id },
      include: { years: true, make: true },
    });
  } catch (error) {
    console.warn(`Error fetching model ${id}: ${error.message}. Using fallback data.`);
    // Search through all fallback models to find matching ID
    for (const makeId in FALLBACK_MODELS) {
      const model = FALLBACK_MODELS[makeId].find(model => model.id === id);
      if (model) return model;
    }
    return null;
  }
}

// Create a new model
export async function createModel(data) {
  try {
    return await prisma.model.create({
      data,
    });
  } catch (error) {
    console.error(`Error creating model: ${error.message}`);
    throw error;
  }
}

// Update an existing model
export async function updateModel(id, data) {
  try {
    return await prisma.model.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error(`Error updating model ${id}: ${error.message}`);
    throw error;
  }
}

// Delete a model by ID
export async function deleteModel(id) {
  try {
    return await prisma.model.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting model ${id}: ${error.message}`);
    throw error;
  }
}

// Find a model by name for a specific make
export async function getModelByName(makeId, name) {
  try {
    return await prisma.model.findFirst({
      where: {
        makeId,
        name: { equals: name, mode: "insensitive" },
      },
    });
  } catch (error) {
    console.warn(`Error finding model by name ${name} for make ${makeId}: ${error.message}. Using fallback data.`);
    const models = FALLBACK_MODELS[makeId] || [];
    return models.find(model => model.name.toLowerCase() === name.toLowerCase()) || null;
  }
}

// Create multiple models at once
export async function bulkCreateModels(data) {
  try {
    return await prisma.model.createMany({
      data,
      skipDuplicates: true,
    });
  } catch (error) {
    console.error(`Error bulk creating models: ${error.message}`);
    throw error;
  }
} 