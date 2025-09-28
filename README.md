# Project

This project includes a CI workflow that validates code quality and runs tests.

## CI/CD

The project uses GitHub Actions for continuous integration with two parallel jobs:

- **Tests**: Runs the test suite to ensure code functionality
- **Hygiene**: Performs code quality checks including linting and formatting

The workflow triggers on:
- Pull requests to the main branch
- Pushes to the main branch

## Getting Started

To run the project locally:

```bash
npm install
npm test
npm run lint
npm run format
```

## Testing

Tests are located in the `tests/` directory and can be run with `npm test`.