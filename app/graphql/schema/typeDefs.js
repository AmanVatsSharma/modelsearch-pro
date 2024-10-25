export const typeDefs = `#graphql
  scalar Date

  type Query {
    # Make queries
    makes: [Make!]!
    make(id: ID!): Make
    
    # Model queries
    models(makeId: ID!): [Model!]!
    model(id: ID!): Model
    
    # Year queries
    years(modelId: ID!): [Year!]!
    year(id: ID!): Year
    
    # Submodel queries
    submodels(yearId: ID!): [Submodel!]!
    submodel(id: ID!): Submodel
    
    # Product queries
    products(page: Int, limit: Int, search: String): ProductsPayload!
    product(id: ID!): Product
    compatibleProducts(yearId: ID!, submodelId: ID, page: Int, limit: Int): ProductsPayload!
    
    # Fitment queries
    fitments(productId: ID!): [Fitment!]!
    fitment(id: ID!): Fitment
    
    # Settings queries
    settings: Settings!
    
    # Analytics queries
    searchLogs(startDate: String, endDate: String, page: Int, limit: Int): SearchLogsPayload!
    searchStats(startDate: String, endDate: String): SearchStats!
    productViews(startDate: String, endDate: String, page: Int, limit: Int): ProductViewsPayload!
    topViewedProducts(startDate: String, endDate: String, limit: Int): [ProductViewCount!]!
    
    # Import job queries
    importJobs(page: Int, limit: Int): ImportJobsPayload!
    importJob(id: ID!): ImportJob
    pendingImportJobs: [ImportJob!]!
    processingImportJobs: [ImportJob!]!
  }
  
  type Mutation {
    # Make mutations
    createMake(input: MakeInput!): Make!
    updateMake(id: ID!, input: MakeInput!): Make!
    deleteMake(id: ID!): Boolean!
    
    # Model mutations
    createModel(input: ModelInput!): Model!
    updateModel(id: ID!, input: ModelInput!): Model!
    deleteModel(id: ID!): Boolean!
    
    # Year mutations
    createYear(input: YearInput!): Year!
    updateYear(id: ID!, input: YearInput!): Year!
    deleteYear(id: ID!): Boolean!
    
    # Submodel mutations
    createSubmodel(input: SubmodelInput!): Submodel!
    updateSubmodel(id: ID!, input: SubmodelInput!): Submodel!
    deleteSubmodel(id: ID!): Boolean!
    
    # Product mutations
    createProduct(input: ProductInput!): Product!
    updateProduct(id: ID!, input: ProductUpdateInput!): Product!
    deleteProduct(id: ID!): Boolean!
    
    # Fitment mutations
    createFitment(input: FitmentInput!): Fitment!
    updateFitment(id: ID!, input: FitmentUpdateInput!): Fitment!
    deleteFitment(id: ID!): Boolean!
    deleteProductFitments(productId: ID!): Boolean!
    
    # Settings mutations
    updateSettings(input: SettingsInput!): Settings!
    
    # Analytics mutations
    createSearchLog(input: SearchLogInput!): SearchLog!
    createProductView(input: ProductViewInput!): ProductView!
    
    # Import job mutations
    createImportJob(input: ImportJobInput!): ImportJob!
    updateImportJob(id: ID!, input: ImportJobUpdateInput!): ImportJob!
    markImportJobComplete(id: ID!, processedRows: Int!, errorRows: Int, errorLog: String): ImportJob!
    markImportJobFailed(id: ID!, errorLog: String!): ImportJob!
    deleteImportJob(id: ID!): Boolean!
  }
  
  # Vehicle data types
  
  type Make {
    id: ID!
    name: String!
    models: [Model!]!
    createdAt: Date!
    updatedAt: Date!
  }
  
  type Model {
    id: ID!
    name: String!
    makeId: ID!
    make: Make!
    years: [Year!]!
    createdAt: Date!
    updatedAt: Date!
  }
  
  type Year {
    id: ID!
    value: Int!
    modelId: ID!
    model: Model!
    submodels: [Submodel!]!
    createdAt: Date!
    updatedAt: Date!
  }
  
  type Submodel {
    id: ID!
    name: String!
    yearId: ID!
    year: Year!
    createdAt: Date!
    updatedAt: Date!
  }
  
  # Product and fitment types
  
  type Product {
    id: ID!
    title: String!
    handle: String!
    shop: String!
    fitments: [Fitment!]!
    createdAt: Date!
    updatedAt: Date!
  }
  
  type Fitment {
    id: ID!
    productId: ID!
    product: Product!
    yearId: ID!
    year: Year!
    submodelId: ID
    submodel: Submodel
    notes: String
    createdAt: Date!
    updatedAt: Date!
  }
  
  # Settings types
  
  type Settings {
    id: ID!
    shop: String!
    widgetTitle: String!
    widgetPlacement: String!
    widgetTheme: String!
    widgetButtonText: String!
    rememberVehicleEnabled: Boolean!
    rememberDays: Int!
    createdAt: Date!
    updatedAt: Date!
  }
  
  # Analytics types
  
  type SearchLog {
    id: ID!
    shop: String!
    makeId: ID
    modelId: ID
    yearId: ID
    submodelId: ID
    ipAddress: String
    userAgent: String
    searchResults: Int!
    successful: Boolean!
    sessionId: String
    createdAt: Date!
  }
  
  type SearchStats {
    totalSearches: Int!
    successfulSearches: Int!
    successRate: Float!
    topMakes: [MakeCount!]!
    topModels: [ModelCount!]!
  }
  
  type MakeCount {
    makeId: ID!
    count: Int!
  }
  
  type ModelCount {
    modelId: ID!
    count: Int!
  }
  
  type ProductView {
    id: ID!
    shop: String!
    productId: ID!
    makeId: ID
    modelId: ID
    yearId: ID
    submodelId: ID
    sessionId: String
    createdAt: Date!
  }
  
  type ProductViewCount {
    productId: ID!
    count: Int!
  }
  
  # Import job types
  
  type ImportJob {
    id: ID!
    shop: String!
    filename: String!
    status: String!
    totalRows: Int!
    processedRows: Int!
    errorRows: Int!
    errorLog: String
    createdAt: Date!
    completedAt: Date
  }
  
  # Pagination and payload types
  
  type PaginationInfo {
    page: Int!
    pageSize: Int!
    totalItems: Int!
    totalPages: Int!
  }
  
  type ProductsPayload {
    products: [Product!]!
    pagination: PaginationInfo!
  }
  
  type SearchLogsPayload {
    logs: [SearchLog!]!
    pagination: PaginationInfo!
  }
  
  type ProductViewsPayload {
    views: [ProductView!]!
    pagination: PaginationInfo!
  }
  
  type ImportJobsPayload {
    jobs: [ImportJob!]!
    pagination: PaginationInfo!
  }
  
  # Input types
  
  input MakeInput {
    name: String!
  }
  
  input ModelInput {
    name: String!
    makeId: ID!
  }
  
  input YearInput {
    value: Int!
    modelId: ID!
  }
  
  input SubmodelInput {
    name: String!
    yearId: ID!
  }
  
  input ProductInput {
    id: ID!
    title: String!
    handle: String!
  }
  
  input ProductUpdateInput {
    title: String
    handle: String
  }
  
  input FitmentInput {
    productId: ID!
    yearId: ID!
    submodelId: ID
    notes: String
  }
  
  input FitmentUpdateInput {
    notes: String
    submodelId: ID
  }
  
  input SettingsInput {
    widgetTitle: String
    widgetPlacement: String
    widgetTheme: String
    widgetButtonText: String
    rememberVehicleEnabled: Boolean
    rememberDays: Int
  }
  
  input SearchLogInput {
    makeId: ID
    modelId: ID
    yearId: ID
    submodelId: ID
    ipAddress: String
    userAgent: String
    searchResults: Int!
    successful: Boolean!
    sessionId: String
  }
  
  input ProductViewInput {
    productId: ID!
    makeId: ID
    modelId: ID
    yearId: ID
    submodelId: ID
    sessionId: String
  }
  
  input ImportJobInput {
    filename: String!
    totalRows: Int!
  }
  
  input ImportJobUpdateInput {
    status: String
    processedRows: Int
    errorRows: Int
    errorLog: String
  }
`; 