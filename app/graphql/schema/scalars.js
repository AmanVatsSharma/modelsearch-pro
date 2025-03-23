import { GraphQLScalarType, Kind } from 'graphql';

// Date scalar for handling dates
const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value.toISOString(); // Convert outgoing Date to ISO string
  },
  parseValue(value) {
    return new Date(value); // Convert incoming string to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value); // Convert AST string to Date
    }
    return null;
  },
});

export const typeDefs = `#graphql
  scalar Date
`;

export const resolvers = {
  Date: dateScalar,
}; 