# TESTING.md

## Testing Strategy

We enforce a three-tier testing approach to ensure comprehensive coverage:

1. **Unit Tests** - Test pure functions and isolated business logic
2. **Integration Tests** - Test service layers and module interactions
3. **E2E Tests** - Test complete user flows through the entire application

## Test Framework Configuration

### Core Tools
* **Test Runner:** Jest with `ts-jest` preset
* **E2E Framework:** Jest with Supertest for HTTP testing
* **Assertion Library:** Jest's built-in expect
* **Mocking:** Jest mocks and `jest-mock-extended` for TypeScript interfaces

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts',
    '**/__tests__/**/*.e2e.ts',
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testTimeout: 10000, // 10 seconds for async operations
  maxWorkers: '50%', // Use half of available CPU cores
};
```

## Test Organization

### Directory Structure
```
src/
├── services/
│   ├── userService.ts
│   └── __tests__/
│       ├── userService.test.ts    # Unit tests
│       └── userService.int.ts     # Integration tests
├── utils/
│   ├── calculator.ts
│   └── __tests__/
│       └── calculator.test.ts     # Unit tests
test/
├── e2e/
│   └── api.e2e.ts                # E2E tests
└── setup.ts                      # Global test setup
```

## Testing Patterns

### Unit Tests
For pure functions with no side effects:

```typescript
// calculator.test.ts
describe('Calculator', () => {
  describe('add', () => {
    it('should return sum of two numbers', () => {
      expect(add(2, 3)).toBe(5);
    });
    
    it('should handle negative numbers', () => {
      expect(add(-1, 1)).toBe(0);
    });
  });
});
```

### Integration Tests
For testing services with dependencies:

```typescript
// userService.int.ts
describe('UserService Integration', () => {
  let app: Application;
  let server: Server;
  
  beforeAll(async () => {
    // Start server in background - non-blocking
    app = await createApp();
    server = app.listen(0); // Random port
  });
  
  afterAll(async () => {
    // Cleanup
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  
  beforeEach(async () => {
    // Reset database state
    await resetDatabase();
  });
  
  it('should create and retrieve user', async () => {
    const service = new UserService();
    const user = await service.create({ name: 'Test' });
    expect(user.id).toBeDefined();
  });
});
```

### E2E Tests
For testing complete application flows:

```typescript
// api.e2e.ts
import request from 'supertest';

describe('API E2E', () => {
  let app: Application;
  let server: Server;
  
  beforeAll(async () => {
    // Non-blocking server initialization
    app = await createApp({ 
      port: 0,  // Random port
      env: 'test' 
    });
    server = app.listen();
  });
  
  afterAll(async () => {
    await closeDatabase();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
  
  describe('POST /users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/users')
        .send({ name: 'John', email: 'john@test.com' })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('john@test.com');
    });
  });
});
```

## Async Testing Best Practices

### Non-Blocking Test Setup
Always use async patterns for server/database initialization:

```typescript
// ✅ Good - Non-blocking
beforeAll(async () => {
  server = await startServer();
  db = await connectDatabase();
});

// ❌ Bad - Blocking
beforeAll(() => {
  server = startServerSync(); // Blocks test runner
});
```

### Parallel Test Execution
```typescript
// jest.config.js
{
  maxWorkers: '50%',  // Run tests in parallel
  testTimeout: 10000, // Allow time for async operations
}
```

### Resource Management
```typescript
// Global test setup (test/setup.ts)
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
});

afterAll(async () => {
  await mongoServer.stop();
});
```

## Mocking Strategies

### Network Requests
```typescript
// Use jest.mock for external services
jest.mock('../services/emailService');

// Or use MSW for HTTP mocking
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json({ users: [] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Database Mocking
```typescript
// For unit tests - mock the repository
jest.mock('../repositories/userRepository');

// For integration tests - use test database
beforeEach(async () => {
  await db.clear();
  await db.seed();
});
```

## Coverage Requirements

### Minimum Thresholds
```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      }
    }
  }
}
```

### Coverage Exclusions
* Configuration files
* Type definition files (`.d.ts`)
* Test files themselves
* Generated code

## Test Execution Commands

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testMatch='**/*.test.ts'",
    "test:int": "jest --testMatch='**/*.int.ts'",
    "test:e2e": "jest --testMatch='**/*.e2e.ts'",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

## Testing Checklist

Before committing:
- [ ] All tests pass locally
- [ ] Unit tests cover pure functions
- [ ] Integration tests verify service interactions
- [ ] E2E tests validate critical user paths
- [ ] Coverage meets minimum thresholds
- [ ] No tests are skipped with `.skip()`
- [ ] Async operations use proper setup/teardown
- [ ] Database/server resources are properly cleaned up
