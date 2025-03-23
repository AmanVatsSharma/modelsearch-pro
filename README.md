# FitSearch Pro - Vehicle Fitment Search for Shopify

FitSearch Pro is a comprehensive vehicle fitment search solution for Shopify stores selling auto parts and accessories. This app enables customers to find parts that fit their specific vehicle by selecting their vehicle's make, model, year, and submodel.

## Features

- **Vehicle Search Widget**: Multi-step dropdown search for vehicles
- **Comprehensive Fitment Database**: Store and manage complex vehicle-product relationships
- **Admin Dashboard**: Import, export, and manage fitment data
- **Compatible Products Display**: Show customers which products fit their vehicle
- **Analytics & Reporting**: Track search activity and conversion metrics
- **Theme Integration**: Seamless integration with Shopify themes
- **App Extensions**: Enhanced product management and listing experience

## Architecture

FitSearch Pro is built using the Remix Shopify App template and follows a modular architecture:

1. **Database & API Layer** (Core Backend)
2. **Search Widget Frontend** (Customer-facing interface)
3. **Fitment Tables & Compatibility Widget** (Product display components)
4. **Admin Dashboard** (Merchant control panel)
5. **Theme Integration & App Extensions** (Shopify store integration)
6. **Analytics & Reporting** (Data insights)
7. **Import/Export System** (Data management)

## Technology Stack

- **Frontend**: React, Shopify Polaris, Tailwind CSS
- **Backend**: Node.js, Remix, Prisma ORM
- **Database**: PostgreSQL
- **API**: GraphQL, REST
- **Authentication**: Shopify App Bridge Auth
- **Deployment**: Shopify App Hosting

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL database
- Shopify Partner account
- Shopify Development store

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/fitsearch-pro.git
   cd fitsearch-pro
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your Shopify API credentials and database connection string.

4. Set up the database
   ```bash
   npm run setup
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

### Shopify App Setup

1. Create a new app in your Shopify Partner Dashboard
2. Configure the app URL to point to your development server
3. Set up the necessary app scopes
4. Install the app on your development store

## Development

### Database Migrations

```bash
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run migrations
npm run prisma:studio     # Open Prisma Studio
```

### Testing

```bash
npm run test              # Run all tests
npm run test:unit         # Run unit tests
npm run test:integration  # Run integration tests
```

### Building for Production

```bash
npm run build
```

## Module Structure

### 1. Database & API Layer

- `prisma/`: Database schema and migrations
- `app/models/`: Database access methods
- `app/graphql/`: GraphQL schema and resolvers
- `app/routes/api/`: REST API endpoints

### 2. Search Widget Frontend

- `app/components/search-widget/`: Component source code
- `app/routes/search/`: Frontend routes

### 3. Fitment Tables & Compatibility Widget

- `app/components/FitmentTable/`: Fitment table component for displaying all compatible vehicles
- `app/components/CompatibilityWidget/`: Widget for checking if a product is compatible with a specific vehicle
- `app/routes/app.fitment.jsx`: Demo page showcasing both components
- `app/routes/api.products.$productId.fitments.js`: API endpoint for retrieving fitment data

### 4. Admin Dashboard

- `app/routes/app/`: Admin interface routes
- `app/components/admin/`: Admin components

### 5. Theme Integration & Extensions

- `extensions/`: Shopify theme extensions
- `theme-components/`: Theme component examples

### 6. Analytics & Reporting

- `app/routes/app/analytics/`: Analytics dashboard
- `app/models/analytics.server.js`: Analytics data access

### 7. Import/Export System

- `app/routes/app/import/`: Import interface
- `app/routes/app/export/`: Export interface
- `app/models/import.server.js`: Import processing

## Documentation

- `docs/`: Technical documentation
- `docs/api/`: API documentation
- `docs/db/`: Database schema documentation
- `docs/deployment/`: Deployment guides

## Contributing

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact [support@fitsearchpro.com](mailto:support@fitsearchpro.com).
