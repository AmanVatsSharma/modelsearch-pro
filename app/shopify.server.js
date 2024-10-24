import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-07";
import { prisma } from "./db.server";

// Use the prisma instance from db.server.js with the correct schema mapping
const sessionStorage = new PrismaSessionStorage(prisma);

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage,
  distribution: AppDistribution.AppStore,
  restResources,
  hooks: {
    afterAuth: async (req, session) => {
      // After authentication, ensure the shop is properly registered
      if (session?.shop) {
        try {
          await prisma.shop.upsert({
            where: { shopifyDomain: session.shop },
            update: {
              isActive: true,
              accessToken: session.accessToken,
              scope: session.scope,
            },
            create: {
              shopifyDomain: session.shop,
              isActive: true,
              accessToken: session.accessToken,
              scope: session.scope,
            },
          });
        } catch (error) {
          console.error("Error updating shop record:", error);
        }
      }
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const appProxy = shopify.appProxy;
