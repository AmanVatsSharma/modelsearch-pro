# FitSearch Pro: API Documentation

This document provides comprehensive documentation for the FitSearch Pro API endpoints, including both GraphQL and REST APIs. This documentation is intended for other development agents working on different modules of the application.

## Table of Contents

1. [Authentication](#authentication)
2. [GraphQL API](#graphql-api)
3. [REST API Endpoints](#rest-api-endpoints)
4. [Database Models](#database-models)
5. [Integration Examples](#integration-examples)

## Authentication

All API requests must be authenticated. The application uses Shopify's authentication mechanisms.

### Admin API Authentication

For admin-facing APIs:
- The app uses Shopify's Admin authentication
- All GraphQL requests must include a valid session
- The session is obtained through Shopify's OAuth flow

### Public API Authentication

For theme-facing APIs:
- Public API endpoints use Shopify's App Proxy authentication
- All requests must come through the Shopify App Proxy
- Authentication is handled by the `authenticate.public.appProxy` middleware

## GraphQL API

The GraphQL API is available at the following endpoint:

```
POST /api/graphql
```

### GraphQL Schema

The GraphQL schema includes the following main types:

#### Vehicle Data Types

- `Make`: Vehicle manufacturer
- `Model`: Vehicle model
- `Year`: Vehicle year
- `Submodel`: Vehicle submodel or trim

#### Product and Fitment Types

- `Product`: Product information
- `Fitment`: Association between a product and a vehicle

#### Analytics Types

- `SearchLog`: Log of customer searches
- `ProductView`: Log of product views with vehicle context
- `SearchStats`: Aggregated search statistics

#### Settings and Import Types

- `Settings`: App configuration settings
- `ImportJob`: Import job tracking information

### Main Queries

Here are some of the main queries available:

#### Vehicle Data Queries

```graphql
# Get all makes
query GetMakes {
  makes {
    id
    name
  }
}

# Get models for a specific make
query GetModels($makeId: ID!) {
  models(makeId: $makeId) {
    id
    name
  }
}

# Get years for a specific model
query GetYears($modelId: ID!) {
  years(modelId: $modelId) {
    id
    value
  }
}

# Get submodels for a specific year
query GetSubmodels($yearId: ID!) {
  submodels(yearId: $yearId) {
    id
    name
  }
}
```

#### Product Queries

```graphql
# Get products with pagination
query GetProducts($page: Int, $limit: Int, $search: String) {
  products(page: $page, limit: $limit, search: $search) {
    products {
      id
      title
      handle
    }
    pagination {
      page
      pageSize
      totalItems
      totalPages
    }
  }
}

# Get compatible products for a vehicle
query GetCompatibleProducts($yearId: ID!, $submodelId: ID, $page: Int, $limit: Int) {
  compatibleProducts(yearId: $yearId, submodelId: $submodelId, page: $page, limit: $limit) {
    products {
      id
      title
      handle
    }
    pagination {
      page
      pageSize
      totalItems
      totalPages
    }
  }
}
```

### Main Mutations

#### Vehicle Data Mutations

```graphql
# Create a new make
mutation CreateMake($input: MakeInput!) {
  createMake(input: $input) {
    id
    name
  }
}

# Create a new model
mutation CreateModel($input: ModelInput!) {
  createModel(input: $input) {
    id
    name
    makeId
  }
}
```

#### Fitment Mutations

```graphql
# Create a fitment association
mutation CreateFitment($input: FitmentInput!) {
  createFitment(input: $input) {
    id
    productId
    yearId
    submodelId
    notes
  }
}
```

## REST API Endpoints

The following REST API endpoints are available for theme integration:

### Vehicle Data Endpoints

#### Get Makes

```
GET /api/vehicle/makes
```

**Response:**
```json
{
  "makes": [
    {
      "id": "123",
      "name": "Toyota"
    },
    {
      "id": "456",
      "name": "Honda"
    }
  ]
}
```

#### Get Models

```
GET /api/vehicle/models?makeId=123
```

**Response:**
```json
{
  "models": [
    {
      "id": "789",
      "name": "Camry"
    },
    {
      "id": "101",
      "name": "Corolla"
    }
  ]
}
```

#### Get Years

```
GET /api/vehicle/years?modelId=789
```

**Response:**
```json
{
  "years": [
    {
      "id": "111",
      "value": 2023
    },
    {
      "id": "222",
      "value": 2022
    }
  ]
}
```

### Product Endpoints

#### Get Compatible Products

```
GET /api/products/compatible?yearId=111&submodelId=333&page=1&limit=20
```

**Response:**
```json
{
  "products": [
    {
      "id": "prod_123",
      "title": "Oil Filter",
      "handle": "oil-filter"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

#### Check Product Fitment

```
GET /api/fitment/check?productId=prod_123&yearId=111&submodelId=333
```

**Response:**
```json
{
  "product": {
    "id": "prod_123",
    "title": "Oil Filter",
    "handle": "oil-filter"
  },
  "isFitment": true
}
```

### Settings Endpoint

```
GET /api/settings
```

**Response:**
```json
{
  "widgetTitle": "Find parts for your vehicle",
  "widgetPlacement": "both",
  "widgetTheme": "light",
  "widgetButtonText": "Find Parts",
  "rememberVehicleEnabled": true,
  "rememberDays": 30
}
```

## Database Models

Here's an overview of the main database models:

### Vehicle Hierarchical Data Models

- **Make**: Vehicle manufacturer
  - `id`: Unique identifier
  - `name`: Make name
  - Relationships: One-to-many with Model

- **Model**: Vehicle model
  - `id`: Unique identifier
  - `name`: Model name
  - `makeId`: Reference to parent Make
  - Relationships: Many-to-one with Make, One-to-many with Year

- **Year**: Vehicle year
  - `id`: Unique identifier
  - `value`: Year value (integer)
  - `modelId`: Reference to parent Model
  - Relationships: Many-to-one with Model, One-to-many with Submodel and Fitment

- **Submodel**: Vehicle trim or submodel
  - `id`: Unique identifier
  - `name`: Submodel name
  - `yearId`: Reference to parent Year
  - Relationships: Many-to-one with Year, One-to-many with Fitment

### Product and Fitment Models

- **Product**: Product information
  - `id`: Unique identifier (matches Shopify Product ID)
  - `title`: Product title
  - `handle`: Product handle (URL slug)
  - `shop`: Shop domain
  - Relationships: One-to-many with Fitment

- **Fitment**: Association between Product and Vehicle
  - `id`: Unique identifier
  - `productId`: Reference to Product
  - `yearId`: Reference to Year
  - `submodelId`: Optional reference to Submodel
  - `notes`: Optional fitment notes
  - Relationships: Many-to-one with Product, Year, and Submodel

### Settings and Analytics Models

- **Settings**: App settings
  - `id`: Unique identifier
  - `shop`: Shop domain
  - Various configuration settings

- **SearchLog**: Search activity logs
  - `id`: Unique identifier
  - `shop`: Shop domain
  - Various search parameters and metrics

- **ProductView**: Product view logs
  - `id`: Unique identifier
  - `shop`: Shop domain
  - `productId`: Viewed product
  - Vehicle context information

## Integration Examples

### Search Widget Integration (Agent 2)

To integrate with the search widget:

```javascript
// Fetch makes
const { makes } = await fetch('/api/vehicle/makes').then(res => res.json());

// When a make is selected, fetch models
const { models } = await fetch(`/api/vehicle/models?makeId=${selectedMakeId}`).then(res => res.json());

// When a model is selected, fetch years
const { years } = await fetch(`/api/vehicle/years?modelId=${selectedModelId}`).then(res => res.json());

// When a year is selected, fetch submodels
const { submodels } = await fetch(`/api/vehicle/submodels?yearId=${selectedYearId}`).then(res => res.json());

// When vehicle selection is complete, fetch compatible products
const { products, pagination } = await fetch(
  `/api/products/compatible?yearId=${selectedYearId}&submodelId=${selectedSubmodelId}&page=1&limit=20`
).then(res => res.json());
```

### Fitment Widget Integration (Agent 3)

```javascript
// Check if a product fits a vehicle
const { product, isFitment } = await fetch(
  `/api/fitment/check?productId=${productId}&yearId=${yearId}&submodelId=${submodelId}`
).then(res => res.json());

// Display results based on isFitment
if (isFitment) {
  // Show fit confirmation
} else {
  // Show not compatible message
}
```

### Admin Dashboard Integration (Agent 4)

```javascript
// Using GraphQL to get detailed data
const response = await fetch('/api/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: `
      query GetSearchStats($startDate: String, $endDate: String) {
        searchStats(startDate: $startDate, endDate: $endDate) {
          totalSearches
          successfulSearches
          successRate
          topMakes {
            makeId
            count
          }
          topModels {
            modelId
            count
          }
        }
      }
    `,
    variables: {
      startDate: '2023-01-01',
      endDate: '2023-12-31',
    },
  }),
});

const { data } = await response.json();
```

## Need Help?

For any questions or issues related to the API, please contact Agent-1 through the project's communication channels. 