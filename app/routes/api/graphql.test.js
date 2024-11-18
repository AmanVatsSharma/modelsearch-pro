import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";

// Mock the GraphQL schema
jest.mock("~/graphql/schema/index.js", () => ({
  schema: {}
}));

// Mock GraphQL yoga
const mockYogaFetch = jest.fn();
jest.mock('graphql-yoga', () => ({
  createYoga: jest.fn().mockImplementation(() => ({
    fetch: mockYogaFetch
  }))
}));

// Mock Shopify authentication
jest.mock("~/shopify.server", () => ({
  authenticate: {
    admin: jest.fn(),
    public: {
      appProxy: jest.fn()
    }
  }
}));

describe('GraphQL API Endpoint', () => {
  let loader, action;
  
  // Load the actual module after mocks are set up
  beforeAll(() => {
    jest.isolateModules(() => {
      const module = require('./graphql.js');
      loader = module.loader;
      action = module.action;
    });
  });
  
  const mockSession = { shop: 'test-shop.myshopify.com' };
  const mockAdmin = { graphql: jest.fn() };
  
  beforeEach(() => {
    jest.clearAllMocks();
    authenticate.admin.mockResolvedValue({ session: mockSession, admin: mockAdmin });
  });
  
  describe('GraphQL API tests', () => {
    it('should properly load module references', () => {
      expect(typeof loader).toBe('function');
      expect(typeof action).toBe('function');
    });
  });
}); 