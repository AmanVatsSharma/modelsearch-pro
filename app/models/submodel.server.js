import { prisma } from "~/db.server.js";

// Fallback data for when the database is unavailable
const FALLBACK_SUBMODELS = {
  // Ford F-150 submodels by year
  "ford-f150-2022": [
    { id: "ford-f150-2022-xlt", name: "XLT", yearId: "ford-f150-2022" },
    { id: "ford-f150-2022-lariat", name: "Lariat", yearId: "ford-f150-2022" },
    { id: "ford-f150-2022-platinum", name: "Platinum", yearId: "ford-f150-2022" },
  ],
  "ford-f150-2021": [
    { id: "ford-f150-2021-xlt", name: "XLT", yearId: "ford-f150-2021" },
    { id: "ford-f150-2021-lariat", name: "Lariat", yearId: "ford-f150-2021" },
    { id: "ford-f150-2021-platinum", name: "Platinum", yearId: "ford-f150-2021" },
  ],
  
  // Ford Mustang submodels by year
  "ford-mustang-2022": [
    { id: "ford-mustang-2022-gt", name: "GT", yearId: "ford-mustang-2022" },
    { id: "ford-mustang-2022-ecoboost", name: "EcoBoost", yearId: "ford-mustang-2022" },
    { id: "ford-mustang-2022-shelby", name: "Shelby GT500", yearId: "ford-mustang-2022" },
  ],
  
  // Toyota Camry submodels by year
  "toyota-camry-2022": [
    { id: "toyota-camry-2022-le", name: "LE", yearId: "toyota-camry-2022" },
    { id: "toyota-camry-2022-se", name: "SE", yearId: "toyota-camry-2022" },
    { id: "toyota-camry-2022-xle", name: "XLE", yearId: "toyota-camry-2022" },
  ],
  
  // Generic fallback for any year not explicitly defined
  "generic": [
    { id: "generic-base", name: "Base", yearId: "generic" },
    { id: "generic-standard", name: "Standard", yearId: "generic" },
    { id: "generic-premium", name: "Premium", yearId: "generic" },
  ]
};

export async function getSubmodels(shop, yearId) {
  try {
    const submodels = await prisma.submodel.findMany({
      where: { yearId },
      orderBy: { name: "asc" },
    });
    console.log(`Found ${submodels.length} submodels for yearId ${yearId} from database`);
    return submodels;
  } catch (error) {
    console.warn(`Error fetching submodels for yearId ${yearId}:`, error.message);
    // Return fallback data for this year or generic fallback
    const fallbackData = FALLBACK_SUBMODELS[yearId] || FALLBACK_SUBMODELS.generic;
    console.log(`Using fallback data: ${fallbackData.length} submodels for yearId ${yearId}`);
    return fallbackData;
  }
}

export async function getSubmodel(id) {
  try {
    return await prisma.submodel.findUnique({
      where: { id },
      include: { year: { include: { model: { include: { make: true } } } } },
    });
  } catch (error) {
    console.warn(`Error fetching submodel with id ${id}:`, error.message);
    
    // Try to find a matching submodel in our fallback data
    for (const yearId in FALLBACK_SUBMODELS) {
      const submodel = FALLBACK_SUBMODELS[yearId].find(s => s.id === id);
      if (submodel) {
        console.log(`Using fallback data for submodel with id ${id}`);
        // Add minimal year, model and make data
        const yearParts = submodel.yearId.split('-');
        const makeId = yearParts[0];
        const modelId = `${makeId}-${yearParts[1]}`;
        const yearValue = parseInt(yearParts[2]);
        
        return {
          ...submodel,
          year: {
            id: submodel.yearId,
            value: yearValue,
            model: {
              id: modelId,
              name: yearParts[1].charAt(0).toUpperCase() + yearParts[1].slice(1),
              make: {
                id: makeId,
                name: makeId.charAt(0).toUpperCase() + makeId.slice(1)
              }
            }
          }
        };
      }
    }
    
    // If no matching submodel found, rethrow the error
    throw error;
  }
}

export async function createSubmodel(data) {
  try {
    return await prisma.submodel.create({
      data,
    });
  } catch (error) {
    console.error("Error creating submodel:", error);
    throw error;
  }
}

export async function updateSubmodel(id, data) {
  try {
    return await prisma.submodel.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error(`Error updating submodel with id ${id}:`, error);
    throw error;
  }
}

export async function deleteSubmodel(id) {
  try {
    return await prisma.submodel.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting submodel with id ${id}:`, error);
    throw error;
  }
}

export async function getSubmodelByName(yearId, name) {
  try {
    return await prisma.submodel.findFirst({
      where: {
        yearId,
        name: { equals: name, mode: "insensitive" },
      },
    });
  } catch (error) {
    console.warn(`Error fetching submodel with yearId ${yearId} and name ${name}:`, error.message);
    
    // Try to find matching submodel in fallback data
    const yearSubmodels = FALLBACK_SUBMODELS[yearId] || FALLBACK_SUBMODELS.generic;
    const submodel = yearSubmodels.find(s => s.name.toLowerCase() === name.toLowerCase());
    
    if (submodel) {
      console.log(`Using fallback data for submodel with name ${name} and yearId ${yearId}`);
      return submodel;
    }
    
    // If no matching submodel found, rethrow the error
    throw error;
  }
}

export async function bulkCreateSubmodels(data) {
  try {
    return await prisma.submodel.createMany({
      data,
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("Error bulk creating submodels:", error);
    throw error;
  }
}