-- CreateTable
CREATE TABLE "Make" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "makeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Model_makeId_fkey" FOREIGN KEY ("makeId") REFERENCES "Make" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Year" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL,
    "modelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Year_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Submodel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Submodel_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Year" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Fitment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "submodelId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Fitment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Fitment_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Year" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Fitment_submodelId_fkey" FOREIGN KEY ("submodelId") REFERENCES "Submodel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "widgetTitle" TEXT NOT NULL DEFAULT 'Find parts for your vehicle',
    "widgetPlacement" TEXT NOT NULL DEFAULT 'both',
    "widgetTheme" TEXT NOT NULL DEFAULT 'light',
    "widgetButtonText" TEXT NOT NULL DEFAULT 'Find Parts',
    "rememberVehicleEnabled" BOOLEAN NOT NULL DEFAULT true,
    "rememberDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "makeId" TEXT,
    "modelId" TEXT,
    "yearId" TEXT,
    "submodelId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "searchResults" INTEGER NOT NULL DEFAULT 0,
    "successful" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProductView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "makeId" TEXT,
    "modelId" TEXT,
    "yearId" TEXT,
    "submodelId" TEXT,
    "sessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "errorLog" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "Make_name_idx" ON "Make"("name");

-- CreateIndex
CREATE INDEX "Model_makeId_idx" ON "Model"("makeId");

-- CreateIndex
CREATE INDEX "Model_name_idx" ON "Model"("name");

-- CreateIndex
CREATE INDEX "Year_modelId_idx" ON "Year"("modelId");

-- CreateIndex
CREATE INDEX "Year_value_idx" ON "Year"("value");

-- CreateIndex
CREATE INDEX "Submodel_yearId_idx" ON "Submodel"("yearId");

-- CreateIndex
CREATE INDEX "Submodel_name_idx" ON "Submodel"("name");

-- CreateIndex
CREATE INDEX "Product_shop_idx" ON "Product"("shop");

-- CreateIndex
CREATE INDEX "Product_handle_idx" ON "Product"("handle");

-- CreateIndex
CREATE INDEX "Fitment_productId_idx" ON "Fitment"("productId");

-- CreateIndex
CREATE INDEX "Fitment_yearId_idx" ON "Fitment"("yearId");

-- CreateIndex
CREATE INDEX "Fitment_submodelId_idx" ON "Fitment"("submodelId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_shop_key" ON "Settings"("shop");

-- CreateIndex
CREATE INDEX "SearchLog_shop_idx" ON "SearchLog"("shop");

-- CreateIndex
CREATE INDEX "SearchLog_createdAt_idx" ON "SearchLog"("createdAt");

-- CreateIndex
CREATE INDEX "ProductView_shop_idx" ON "ProductView"("shop");

-- CreateIndex
CREATE INDEX "ProductView_productId_idx" ON "ProductView"("productId");

-- CreateIndex
CREATE INDEX "ProductView_createdAt_idx" ON "ProductView"("createdAt");

-- CreateIndex
CREATE INDEX "ImportJob_shop_idx" ON "ImportJob"("shop");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");
