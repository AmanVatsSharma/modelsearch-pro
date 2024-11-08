import { prisma } from "~/db.server.js";

// Fallback data for when the database is unavailable
const FALLBACK_YEARS = {
  // Ford models
  "ford-f150": [
    { id: "ford-f150-2022", value: 2022, modelId: "ford-f150" },
    { id: "ford-f150-2021", value: 2021, modelId: "ford-f150" },
    { id: "ford-f150-2020", value: 2020, modelId: "ford-f150" },
    { id: "ford-f150-2019", value: 2019, modelId: "ford-f150" },
  ],
  "ford-mustang": [
    { id: "ford-mustang-2022", value: 2022, modelId: "ford-mustang" },
    { id: "ford-mustang-2021", value: 2021, modelId: "ford-mustang" },
    { id: "ford-mustang-2020", value: 2020, modelId: "ford-mustang" },
  ],
  
  // Toyota models
  "toyota-camry": [
    { id: "toyota-camry-2022", value: 2022, modelId: "toyota-camry" },
    { id: "toyota-camry-2021", value: 2021, modelId: "toyota-camry" },
    { id: "toyota-camry-2020", value: 2020, modelId: "toyota-camry" },
  ],
  "toyota-corolla": [
    { id: "toyota-corolla-2022", value: 2022, modelId: "toyota-corolla" },
    { id: "toyota-corolla-2021", value: 2021, modelId: "toyota-corolla" },
    { id: "toyota-corolla-2020", value: 2020, modelId: "toyota-corolla" },
  ],
  
  // Add a generic fallback for any model not explicitly defined
  "generic": [
    { id: "generic-2023", value: 2023, modelId: "generic" },
    { id: "generic-2022", value: 2022, modelId: "generic" },
    { id: "generic-2021", value: 2021, modelId: "generic" },
    { id: "generic-2020", value: 2020, modelId: "generic" },
    { id: "generic-2019", value: 2019, modelId: "generic" },
  ]
};

export async function getYears(shop, modelId) {
  try {
    const years = await prisma.year.findMany({
      where: { modelId },
      orderBy: { value: "desc" },
    });
    console.log(`Found ${years.length} years for modelId ${modelId} from database`);
    return years;
  } catch (error) {
    console.warn(`Error fetching years for modelId ${modelId}:`, error.message);
    // Return fallback data for this model or generic fallback
    const fallbackData = FALLBACK_YEARS[modelId] || FALLBACK_YEARS.generic;
    console.log(`Using fallback data: ${fallbackData.length} years for modelId ${modelId}`);
    return fallbackData;
  }
}

export async function getYear(id) {
  try {
    return await prisma.year.findUnique({
      where: { id },
      include: { submodels: true, model: { include: { make: true } } },
    });
  } catch (error) {
    console.warn(`Error fetching year with id ${id}:`, error.message);
    
    // Try to find a matching year in our fallback data
    for (const modelId in FALLBACK_YEARS) {
      const year = FALLBACK_YEARS[modelId].find(y => y.id === id);
      if (year) {
        console.log(`Using fallback data for year with id ${id}`);
        // Add minimal model and make data
        return {
          ...year,
          submodels: [],
          model: {
            id: year.modelId,
            name: year.modelId.split('-').pop(),
            make: {
              id: year.modelId.split('-')[0],
              name: year.modelId.split('-')[0].charAt(0).toUpperCase() + year.modelId.split('-')[0].slice(1)
            }
          }
        };
      }
    }
    
    // If no matching year found, rethrow the error
    throw error;
  }
}

export async function createYear(data) {
  try {
    return await prisma.year.create({
      data,
    });
  } catch (error) {
    console.error("Error creating year:", error);
    throw error;
  }
}

export async function updateYear(id, data) {
  try {
    return await prisma.year.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error(`Error updating year with id ${id}:`, error);
    throw error;
  }
}

export async function deleteYear(id) {
  try {
    return await prisma.year.delete({
      where: { id },
    });
  } catch (error) {
    console.error(`Error deleting year with id ${id}:`, error);
    throw error;
  }
}

export async function getYearByValue(modelId, value) {
  try {
    return await prisma.year.findFirst({
      where: {
        modelId,
        value,
      },
    });
  } catch (error) {
    console.warn(`Error fetching year with modelId ${modelId} and value ${value}:`, error.message);
    
    // Try to find matching year in fallback data
    const modelYears = FALLBACK_YEARS[modelId] || FALLBACK_YEARS.generic;
    const year = modelYears.find(y => y.value === Number(value));
    
    if (year) {
      console.log(`Using fallback data for year with value ${value} and modelId ${modelId}`);
      return year;
    }
    
    // If no matching year found, rethrow the error
    throw error;
  }
}

export async function bulkCreateYears(data) {
  try {
    return await prisma.year.createMany({
      data,
      skipDuplicates: true,
    });
  } catch (error) {
    console.error("Error bulk creating years:", error);
    throw error;
  }
} 