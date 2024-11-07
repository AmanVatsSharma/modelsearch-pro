import { prisma } from "~/db.server.js";

// Fallback data to use when database is not ready
const FALLBACK_MAKES = [
  { id: "ford", name: "Ford" },
  { id: "toyota", name: "Toyota" },
  { id: "honda", name: "Honda" },
  { id: "chevrolet", name: "Chevrolet" },
  { id: "bmw", name: "BMW" },
  { id: "mercedes", name: "Mercedes-Benz" },
  { id: "audi", name: "Audi" },
  { id: "nissan", name: "Nissan" }
];

/**
 * Get all vehicle makes, with fallback data if the database is not available
 * @param {string} shop The shop domain
 * @returns {Array} Array of make objects
 */
export async function getMakes(shop) {
  try {
    // Try to get makes from the database
    const makes = await prisma.make.findMany({
      orderBy: { name: "asc" },
    });
    
    console.log(`Retrieved ${makes.length} makes from database for shop: ${shop}`);
    return makes;
  } catch (error) {
    // If the database query fails, use fallback data
    console.warn(`Error fetching makes from database: ${error.message}. Using fallback data.`);
    return FALLBACK_MAKES;
  }
}

/**
 * Get a specific make by ID, with fallback
 * @param {string} id The make ID
 * @returns {Object|null} Make object or null if not found
 */
export async function getMake(id) {
  try {
    return await prisma.make.findUnique({
      where: { id },
      include: { models: true },
    });
  } catch (error) {
    console.warn(`Error fetching make ${id}: ${error.message}. Using fallback data.`);
    return FALLBACK_MAKES.find(make => make.id === id) || null;
  }
}

/**
 * Create a new make
 * @param {Object} data Make data
 * @returns {Object} Created make
 */
export async function createMake(data) {
  try {
    return await prisma.make.create({
      data,
    });
  } catch (error) {
    console.error(`Error creating make: ${error.message}`);
    throw error;
  }
}

/**
 * Update an existing make
 * @param {string} id Make ID
 * @param {Object} data Updated make data
 * @returns {Object} Updated make
 */
export async function updateMake(id, data) {
  try {
    return await prisma.make.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error(`Error updating make ${id}: ${error.message}`);
    throw error;
  }
}

/**
 * Delete a make by ID
 * @param {string} id Make ID
 * @returns {Object} Deleted make
 */
export async function deleteMake(id) {
  try {
    return await prisma.make.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting make ${id}: ${error.message}`);
    throw error;
  }
}

/**
 * Find a make by name (case insensitive)
 * @param {string} name Make name
 * @returns {Object|null} Make object or null if not found
 */
export async function getMakeByName(name) {
  try {
    return await prisma.make.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });
  } catch (error) {
    console.warn(`Error finding make by name ${name}: ${error.message}. Using fallback data.`);
    return FALLBACK_MAKES.find(make => 
      make.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }
}

/**
 * Create multiple makes at once
 * @param {Array} data Array of make objects
 * @returns {Object} Create result
 */
export async function bulkCreateMakes(data) {
  try {
    return await prisma.make.createMany({
      data,
      skipDuplicates: true,
    });
  } catch (error) {
    console.error(`Error bulk creating makes: ${error.message}`);
    throw error;
  }
}

export async function getAllMakes() {
  return prisma.make.findMany({
    orderBy: { name: "asc" },
  });
} 