import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { createYoga } from 'graphql-yoga';
import { schema } from "../graphql/schema/index.js";

// Create the Yoga instance with our schema
const yoga = createYoga({
  schema,
  graphiql: true, // Always enable GraphiQL for easy testing
  landingPage: false, // Disable the landing page
  graphqlEndpoint: '/api/graphql', // This should match the actual route
});

export async function loader({ request }) {
  // Handle both GET and POST requests for GraphiQL and introspection
  return yoga.fetch(request);
}

export async function action({ request }) {
  // Authenticate and get the session
  const { admin, session } = await authenticate.admin(request);

  if (!session) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create a new request with session context
  const newRequest = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  // Make the session available in the GraphQL context
  const response = await yoga.fetch(newRequest, {
    context: {
      session,
      admin,
    }
  });

  return response;
} 