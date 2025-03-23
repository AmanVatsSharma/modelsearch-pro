export default {
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/app/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx}',
    '!app/routes/**/*.jsx',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  transformIgnorePatterns: ['/node_modules/(?!(@shopify|@remix-run))'],
}; 