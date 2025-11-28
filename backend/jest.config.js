export default {
  testEnvironment: 'node',
  transform: {}, // Disable transformation for ESM
  verbose: true,
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 10000
};