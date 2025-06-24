# Testing Guide

## Overview

This project uses a minimal but effective testing setup to catch breaking changes without over-engineering the test suite.

## Testing Stack

### Frontend Testing
- **Vitest**: Fast unit test runner (Vite-native)
- **React Testing Library**: Component testing utilities
- **jsdom**: DOM environment for testing

### Backend Testing
- **Jest**: Node.js test runner
- **AWS SDK Client Mock**: Mock AWS services
- **Custom test utilities**: Lambda event/context helpers

## Running Tests

```bash
# Run all tests
npm test

# Run frontend tests only
npm run test:frontend

# Run backend tests only
npm run test:backend

# Run tests in watch mode
npm run test:watch

# Run smoke tests (basic functionality check)
npm run smoke-test
```

## Test Structure

### Frontend Tests
- **Component tests**: Basic rendering and interaction tests
- **Utility tests**: Game logic and helper functions
- **Integration tests**: User flow testing
- Located in `frontend/src/**/*.test.tsx`

### Backend Tests
- **Handler tests**: Lambda function testing
- **Service tests**: Business logic testing
- **Integration tests**: AWS service integration
- Located in `backend/src/**/*.test.ts`

## Test Utilities

### Frontend
- `frontend/src/test/test-utils.tsx`: Custom render with providers
- `frontend/src/test/setup.ts`: Global test setup and mocks

### Backend
- `backend/src/test/test-utils.ts`: Lambda event/context helpers
- `backend/src/test/setup.ts`: AWS mocks and environment setup

## Testing Philosophy

This project follows a **pragmatic testing approach**:

1. **Smoke tests**: Ensure basic functionality works
2. **Critical path testing**: Test core game mechanics and user flows
3. **Regression prevention**: Catch breaking changes in key features
4. **No over-testing**: Focus on high-value tests, not 100% coverage

## What We Test

### ✅ Always Test
- Core game logic (card matching, win conditions)
- Authentication flows
- API endpoints and error handling
- Component rendering without crashes
- Critical user interactions

### ❌ Don't Test
- Third-party library internals
- Trivial getters/setters
- Static content
- Complex styling details
- AWS service implementations (use mocks)

## Adding New Tests

### Frontend Component Test
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders without crashing', () => {
    render(<MyComponent />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

### Backend Handler Test
```typescript
import { describe, it, expect } from '@jest/globals';
import { handler } from './myHandler';
import { createMockEvent, createMockContext } from '@/test/test-utils';

describe('My Handler', () => {
  it('returns success response', async () => {
    const event = createMockEvent({ httpMethod: 'POST' });
    const context = createMockContext();
    
    const response = await handler(event, context);
    
    expect(response.statusCode).toBe(200);
  });
});
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch pushes
- Before deployments

The build will fail if any tests fail, ensuring code quality.

## Troubleshooting

### Common Issues

1. **Tests fail locally but pass in CI**: Check Node.js versions
2. **AWS mock issues**: Ensure AWS SDK mocks are properly reset
3. **React component tests fail**: Check test-utils providers are set up
4. **TypeScript errors in tests**: Ensure proper type imports

### Getting Help

- Check existing test files for examples
- Review error messages carefully
- Ensure all dependencies are installed
- Verify environment variables in test setup