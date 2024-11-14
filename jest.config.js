module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    'node-fetch': 'node-fetch/lib/index.js', // Ensures compatibility
  },
  collectCoverage: true,
  coverageReporters: ['text', 'cobertura'],
  reporters: ['default', ['jest-ctrf-json-reporter', {}]],
};
