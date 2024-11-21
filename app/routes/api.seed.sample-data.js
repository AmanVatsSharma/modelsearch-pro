import { json } from "@remix-run/node";
import { prisma } from "~/db.server";
import { authenticate } from "~/shopify.server";

/**
 * Sample vehicle data to seed the database
 */
const SAMPLE_MAKES = [
  { name: "Toyota" },
  { name: "Honda" },
  { name: "Ford" },
  { name: "Chevrolet" },
  { name: "Nissan" }
];

const SAMPLE_MODELS = {
  "Toyota": [
    { name: "Camry" },
    { name: "Corolla" },
    { name: "RAV4" },
    { name: "Highlander" }
  ],
  "Honda": [
    { name: "Civic" },
    { name: "Accord" },
    { name: "CR-V" },
    { name: "Pilot" }
  ],
  "Ford": [
    { name: "F-150" },
    { name: "Escape" },
    { name: "Explorer" },
    { name: "Mustang" }
  ],
  "Chevrolet": [
    { name: "Silverado" },
    { name: "Equinox" },
    { name: "Tahoe" },
    { name: "Malibu" }
  ],
  "Nissan": [
    { name: "Altima" },
    { name: "Rogue" },
    { name: "Sentra" },
    { name: "Murano" }
  ]
};

const SAMPLE_YEARS = [
  { value: 2023 },
  { value: 2022 },
  { value: 2021 },
  { value: 2020 },
  { value: 2019 }
];

const SAMPLE_SUBMODELS = [
  { name: "Base" },
  { name: "Sport" },
  { name: "Limited" },
  { name: "Premium" }
];

/**
 * API endpoint to seed the database with sample vehicle data
 */
export const action = async ({ request }) => {
  try {
    // Authenticate - try both admin and app proxy
    try {
      await authenticate.admin(request);
      console.log("Admin authentication successful");
    } catch (adminError) {
      try {
        await authenticate.public.appProxy(request);
        console.log("App proxy authentication successful");
      } catch (appProxyError) {
        console.error("Authentication failed:", appProxyError);
        return json({ error: "Authentication failed" }, { status: 401 });
      }
    }

    // Get the current time for timestamps
    const now = new Date();
    
    // Insert sample makes
    const makePromises = SAMPLE_MAKES.map(async (make) => {
      const createdMake = await prisma.make.upsert({
        where: { name: make.name },
        update: {},
        create: {
          name: make.name,
          createdAt: now,
          updatedAt: now
        }
      });
      
      console.log(`Created/Updated make: ${make.name}`);
      
      // Insert models for this make
      const modelPromises = SAMPLE_MODELS[make.name].map(async (model) => {
        const createdModel = await prisma.model.upsert({
          where: { 
            name_makeId: {
              name: model.name,
              makeId: createdMake.id
            }
          },
          update: {},
          create: {
            name: model.name,
            makeId: createdMake.id,
            createdAt: now,
            updatedAt: now
          }
        });
        
        console.log(`Created/Updated model: ${model.name} for make: ${make.name}`);
        
        // Insert years for this model
        const yearPromises = SAMPLE_YEARS.map(async (year) => {
          const createdYear = await prisma.year.upsert({
            where: { 
              value_modelId: {
                value: year.value,
                modelId: createdModel.id
              }
            },
            update: {},
            create: {
              value: year.value,
              modelId: createdModel.id,
              createdAt: now,
              updatedAt: now
            }
          });
          
          console.log(`Created/Updated year: ${year.value} for model: ${model.name}`);
          
          // Insert submodels for this year
          const submodelPromises = SAMPLE_SUBMODELS.map(async (submodel) => {
            await prisma.submodel.upsert({
              where: { 
                name_yearId: {
                  name: submodel.name,
                  yearId: createdYear.id
                }
              },
              update: {},
              create: {
                name: submodel.name,
                yearId: createdYear.id,
                createdAt: now,
                updatedAt: now
              }
            });
            
            console.log(`Created/Updated submodel: ${submodel.name} for year: ${year.value}`);
          });
          
          await Promise.all(submodelPromises);
        });
        
        await Promise.all(yearPromises);
      });
      
      await Promise.all(modelPromises);
    });
    
    await Promise.all(makePromises);

    return json(
      { 
        success: true, 
        message: "Sample data seeded successfully",
        stats: {
          makes: SAMPLE_MAKES.length,
          models: Object.values(SAMPLE_MODELS).flat().length,
          years: SAMPLE_YEARS.length,
          submodels: SAMPLE_SUBMODELS.length,
        }
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("Error seeding sample data:", error);
    return json(
      { 
        success: false, 
        message: "Failed to seed sample data", 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
};

