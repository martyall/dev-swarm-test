# TypeScript Node.js Application

A modern Node.js application built with TypeScript, featuring strict type checking, comprehensive development tooling, and enterprise-grade project structure.

## Features

- **TypeScript 5.3+** with strict configuration
- **Node.js 18+** compatibility
- **Hot reload** development environment with nodemon
- **Comprehensive testing** with Jest and coverage reporting
- **Source maps** for debugging
- **Layered architecture** with proper separation of concerns
- **Graceful shutdown** handling
- **Structured logging** system
- **Environment-based configuration**

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development

```bash
# Development with hot reload
npm run dev

# Development with Node.js debugger
npm run dev:inspect

# Type checking only (no compilation)
npm run type-check

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

## Project Structure

```
├── src/                    # Source code
│   ├── app/               # Application core
│   │   └── Application.ts # Main application class
│   ├── config/           # Configuration management
│   │   └── index.ts      # Environment-based config
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # Shared interfaces
│   ├── utils/            # Utility functions
│   │   └── Logger.ts     # Logging utility
│   └── index.ts          # Application entry point
├── tests/                # Test files
│   ├── build/            # Build-related tests
│   └── dev-workflow.test.ts
├── dist/                 # Compiled JavaScript (generated)
├── coverage/             # Test coverage reports (generated)
├── tsconfig.json         # TypeScript configuration
├── package.json          # Node.js package configuration
└── README.md            # This file
```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run dev:inspect` | Start development server with Node.js debugger |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled application |
| `npm run clean` | Remove build artifacts |
| `npm run type-check` | Run TypeScript type checking |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |

## Configuration

The application uses environment-based configuration. Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

### Available Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Application environment |
| `PORT` | `3000` | Server port number |
| `LOG_LEVEL` | `info` | Logging level |

## Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **Formatting**: Use consistent indentation and spacing
- **Imports**: Use absolute imports with path mapping (`@/*`)
- **Error Handling**: Comprehensive error management throughout

### Architecture Principles

- **Layered Architecture**: Clear separation between app/, config/, utils/, types/
- **Dependency Injection**: Avoid tight coupling between components
- **Error Boundaries**: Proper error handling at all levels
- **Logging**: Structured logging with context and timestamps

### Testing

- Write tests for all business logic
- Use Jest for unit and integration testing
- Aim for high test coverage
- Test both success and error scenarios

```bash
# Run specific test file
npm test -- sourcemaps.test.ts

# Run tests with verbose output
npm test -- --verbose

# Run tests and generate coverage
npm run test:coverage
```

## Building for Production

```bash
# Clean previous build
npm run clean

# Build the application
npm run build

# Start production server
npm start
```

The compiled JavaScript will be output to the `dist/` directory with source maps for debugging.

## Debugging

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug TypeScript",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "sourceMaps": true,
      "cwd": "${workspaceFolder}",
      "protocol": "inspector"
    }
  ]
}
```

### Command Line Debugging

```bash
# Start with debugger attached
npm run dev:inspect

# Then connect your debugger to localhost:9229
```

## Troubleshooting

### Common Issues

**TypeScript compilation errors**
- Run `npm run type-check` to see detailed type errors
- Check `tsconfig.json` for configuration issues

**Development server not starting**
- Ensure Node.js version >= 18.0.0
- Check if port 3000 is available
- Review error logs for dependency issues

**Tests failing**
- Run `npm test -- --verbose` for detailed output
- Check test environment setup
- Verify source maps are generated correctly

### Getting Help

1. Check the console output for error details
2. Review the application logs
3. Verify all dependencies are installed: `npm install`
4. Check Node.js and npm versions match requirements

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following the code style guidelines
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Build the project: `npm run build`
7. Commit your changes: `git commit -am 'Add new feature'`
8. Push to the branch: `git push origin feature/my-feature`
9. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Next Steps

This project is ready for:
- ESLint and Prettier configuration
- Express.js server implementation
- Database integration
- API endpoint development
- Authentication middleware
- Docker containerization

---

**Built with TypeScript and Node.js** | **Enterprise-ready architecture**