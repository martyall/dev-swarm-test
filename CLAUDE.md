# **CLAUDE.md**

### **1. Language and Syntax**

- **Primary Language:** **TypeScript (TS)** is the sole allowed language for all application logic. JavaScript (JS) files are only permissible for configuration files that do not support TypeScript natively (e.g., `webpack.config.js`, `babel.config.js`).
- **TypeScript Version:** We'll use **TypeScript 4.x** or the latest stable version.
- **ECMAScript Version:** All TypeScript should be compiled to **ECMAScript 2022** or later.
- **Syntax & Formatting:** We use **ESLint** and **Prettier** to enforce consistent code style. All code must pass linting and formatting checks before merging.

---

### **2. Tooling and Dependencies**

- **Package Manager:** Use **pnpm** for managing dependencies. It's preferred over npm or yarn due to its efficiency and speed.
- **Transpiler:** The **TypeScript Compiler (tsc)** is the primary tool for transpiling TypeScript to JavaScript.
- **Runtime:** **Node.js** is the runtime environment.
- **Linting & Formatting:** **ESLint** with the **`@typescript-eslint/parser`** and **Prettier**.
- **Git Hooks:** **Husky** and **`lint-staged`** should be used to automatically run lint and format checks on staged files before committing.

---

### **3. Methodologies and Conventions**

- **Architectural Pattern:** We follow a **layered architecture** (e.g., controller, service, repository) to separate concerns. This ensures modularity and testability.
- **File Naming:**
  - **Logic/Services:** camelCase (e.g., `userService.ts`).
  - **Models/Interfaces:** PascalCase (e.g., `User.ts`).
- **Version Control:** The **Git Flow** methodology is used for branching and merging. All new features and bug fixes must be developed in a dedicated branch.
- **Commit Messages:** We use the **Conventional Commits** specification.

---

### **4. Security and Best Practices**

- **Secrets:** Never commit secrets, API keys, or sensitive information directly into the repository. Use environment variables (e.g., `.env` files) and a `.gitignore` file to prevent accidental commits.
- **Dependency Audits:** Regularly run `pnpm audit` to check for security vulnerabilities in dependencies.
- **Type Safety:** Adhere strictly to TypeScript's type system. Use `any` sparingly, and only when absolutely necessary, with a clear comment explaining the reason.
- **Error Handling:** Implement robust error handling with custom error classes and a centralized error-handling middleware.
- **API Security:** All API endpoints should be secured with **rate-limiting** and **authentication/authorization** middleware where appropriate.

## TESTING

- **ALWAYS implement tests specified in acceptance criteria** - When testCases are listed with IDs, file paths, and frameworks,
those exact tests MUST be written
- **Never substitute manual verification for actual tests** - Do not use grep, curl, or manual code inspection instead of writing
Jest tests
- **Test implementation is the primary deliverable** - When a task involves testing, writing the actual test code is the main work,
 not verifying existing functionality
- **Follow the testCases specification exactly** - Use the provided test IDs, file paths, and test frameworks as specified in the
task requirements



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

## METHODOLOGY


### **1. WHAT IS YOUR ROLE**
You are an advanced AI agent coding a project autonomously without human intervention. You will be given a github issue that has
been processed into a series of structured, atomic tasks. Each task has structured data such as

1. Which (business/product/architectural) requirement you are currently fululling.
2. What acceptance criteria are assoicated to that requirement
3. Are there any tests that demonstrate the acceptance criteria
4. What other tasks does this task reference / directly depend on

You should use this information to accomplish the task, using the complete issue description as a guiding light to resolve any ambiguity.

### **2. SPECIAL INSTRUCTIONS**

The tasks have already been broken down into their minimal possible effort, though it is possible that you will need to infer some context
to make more sense out of the task if it is underspecified. In addition to the guidelines here, you
will obey they following priniciples from the moment you are handed a description of the parent github issue

0. **ALWAYS create a new branch before starting work on the tasks** - Use `git checkout -b feature/issue-{number}-{description}`
1. These tasks are considered atomic, and your commit messages have been suggested for you. 
2. Each task should correspond to a single commit, and by the time you are finished you will have a series of commits that fulfill the entire git issue. 
3. If there are acceptance criteria assigned to the issue, you should assess if it is currently possible to resolve the acceptance criteria / tests. If it is not currently possible, you can delay another round, but they muse be fulfilled by the end of the task list. There will be a review period and if you do not pass the review you will be marked as deficient.


#### **3. A SPECIAL NOTE ON ACCEPTANCE CRITERIA**

##### Test-First Approach
- When acceptance criteria include testCases, implement those tests as the primary task deliverable
- Tests are not optional verification - they are required implementation work
- Manual verification (grep, curl, code inspection) never substitutes for actual test code


You should **NOT** spawn any processes in the terminal to assess whether you have met acceptance criteria. The reason for this is obvious: If the process is blocking, you will deadlock yourself. There are ways around this if you need them:

1. Follow the advice in `TESTING` section. If you are able to turn your acceptance criteria into a non-blocking test, you should do that.
2. If it requires observing some kind of consequence in the terminal, you need to write a script that will launch a non blocking process and capture the terminal output in a file. You can then assess the file for the results, clean up the process, remove any artifacts.

### **4. A NOTE ON COMPLETION**
When you are done with an individial task:
- You will append your reasoning to convince your reviewer that you are done to a markdown file `PullRequest.md` (if this file doesn't exist, create it). 
- This file should be sectioned by commit hash, each section should contain the reasoning and any instructions that the reviewer could run in order to convince themselves that you have met the acceptance criteria. 
- If the commit does is not associated with the fulfillment of the acceptance criteria, simple leave it blank.

After you have ingested all the context in this document, request the prompt for your assignment. In the first prompt you will receive the full text of the github issue. When you have understood the issue, **you will then STOP, ACKNOWLEDGE THAT YOU UNDERSTAND THE ISSUE** and prompt for the first task in that issue.

