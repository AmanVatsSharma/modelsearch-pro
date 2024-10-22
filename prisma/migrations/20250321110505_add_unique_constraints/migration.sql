/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Make` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,makeId]` on the table `Model` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,yearId]` on the table `Submodel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[value,modelId]` on the table `Year` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Make_name_key" ON "Make"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Model_name_makeId_key" ON "Model"("name", "makeId");

-- CreateIndex
CREATE UNIQUE INDEX "Submodel_name_yearId_key" ON "Submodel"("name", "yearId");

-- CreateIndex
CREATE UNIQUE INDEX "Year_value_modelId_key" ON "Year"("value", "modelId");
