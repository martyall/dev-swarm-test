module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/__tests__/**/*.e2e.ts',
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts',
    '**/tests/**/*.e2e.ts',
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  testTimeout: 10000,
  maxWorkers: '50%',
};