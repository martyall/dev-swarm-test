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

## **5. Testing Requirements**
* **Testing Standards:** All testing must follow the guidelines in `TESTING.md`
* **Required Reading:** See `TESTING.md` for test structure, patterns, and requirements
* **Test Coverage:** Minimum 70% coverage as specified in `TESTING.md`
