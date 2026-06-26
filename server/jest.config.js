module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  // Clear mocks between tests for isolation
  clearMocks: true,
  // Restore original module implementations after each test
  restoreMocks: true,
};
