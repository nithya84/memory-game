# Testing Plan - AI Image Generation Features

## 🧪 Testing Status Overview

### ✅ Existing Tests (Phase 1)
- [x] **GameBoard Component**: 28 comprehensive tests covering all game functionality
- [x] **Card Component**: Animation and interaction tests
- [x] **Game Logic**: Win detection, move counting, timing tests
- [x] **Responsive Design**: Mobile and desktop layout tests

### 🚧 Required Tests (Phase 2A)

## 1. Backend API Testing

### Authentication Tests
```typescript
// backend/src/handlers/auth.test.ts
describe('Authentication Handlers', () => {
  describe('POST /auth/register', () => {
    - [ ] Should create new parent account with valid data
    - [ ] Should create child account with parent PIN
    - [ ] Should reject duplicate email addresses
    - [ ] Should validate password strength requirements
    - [ ] Should hash passwords securely
    - [ ] Should return JWT token on success
  });
  
  describe('POST /auth/login', () => {
    - [ ] Should authenticate with correct credentials
    - [ ] Should reject invalid email/password
    - [ ] Should return user data and token
    - [ ] Should handle bcrypt verification
  });
});
```

### Theme Generation Tests
```typescript
// backend/src/handlers/themes.test.ts
describe('Theme Generation Handlers', () => {
  describe('POST /themes/generate', () => {
    - [ ] Should generate 25 images for valid theme
    - [ ] Should validate theme input (1-50 chars, alphanumeric)
    - [ ] Should validate style selection (cartoon/realistic/simple)
    - [ ] Should use mock service when USE_MOCK_AI=true
    - [ ] Should check for existing themes before generation
    - [ ] Should return proper image URLs and metadata
    - [ ] Should handle AI generation failures gracefully
    - [ ] Should skip database operations in mock mode
  });
  
  describe('GET /themes', () => {
    - [ ] Should return list of available themes
    - [ ] Should require authentication
    - [ ] Should handle empty theme list
  });
});
```

### Service Layer Tests
```typescript
// backend/src/services/imageGeneration.test.ts
describe('Image Generation Service', () => {
  describe('createMockImages', () => {
    - [ ] Should generate exactly 25 mock images
    - [ ] Should include unique URLs for each image
    - [ ] Should set proper altText and metadata
    - [ ] Should use different random seeds
  });
  
  describe('generateImages (Bedrock)', () => {
    - [ ] Should call Bedrock Titan API correctly
    - [ ] Should handle API rate limits
    - [ ] Should retry on temporary failures
    - [ ] Should validate response format
  });
});

// backend/src/services/s3Service.test.ts
describe('S3 Service', () => {
  - [ ] Should upload images to correct bucket
  - [ ] Should generate thumbnails
  - [ ] Should return proper CDN URLs
  - [ ] Should handle upload failures
});
```

## 2. Frontend Component Testing

### CreateGame Page Tests
```typescript
// frontend/src/pages/CreateGame.test.tsx
describe('CreateGame Page', () => {
  describe('Initial State', () => {
    - [ ] Should render theme input and style selector
    - [ ] Should show empty grid initially
    - [ ] Should disable Generate button when theme is empty
    - [ ] Should enable Generate button with valid theme
  });
  
  describe('Style Selection', () => {
    - [ ] Should default to cartoon style
    - [ ] Should allow switching between styles
    - [ ] Should maintain selection state
  });
  
  describe('Image Generation', () => {
    - [ ] Should show loading state during generation
    - [ ] Should populate grid with 25 images
    - [ ] Should enable image selection after generation
    - [ ] Should handle API errors gracefully
  });
  
  describe('Image Selection', () => {
    - [ ] Should allow selecting up to 20 images
    - [ ] Should prevent selecting more than 20
    - [ ] Should show selection counter
    - [ ] Should disable Create Game until exactly 20 selected
    - [ ] Should enable Create Game with exactly 20 selected
  });
  
  describe('Navigation', () => {
    - [ ] Should navigate to game with selected images
    - [ ] Should pass theme name and image data
    - [ ] Should handle back navigation properly
  });
});
```

### Game Page Tests
```typescript
// frontend/src/pages/Game.test.tsx
describe('Game Page with Custom Images', () => {
  describe('Difficulty Selection', () => {
    - [ ] Should show difficulty selector before game starts
    - [ ] Should limit max difficulty to available images
    - [ ] Should display theme name if provided
    - [ ] Should start game with selected difficulty
  });
  
  describe('Custom Image Integration', () => {
    - [ ] Should use custom images when provided
    - [ ] Should fall back to default images when none provided
    - [ ] Should handle image loading errors
    - [ ] Should maintain aspect ratios
  });
});
```

### API Service Tests
```typescript
// frontend/src/services/api.test.tsx
describe('API Service', () => {
  describe('generateTheme', () => {
    - [ ] Should call correct endpoint with theme and style
    - [ ] Should handle loading states
    - [ ] Should parse response correctly
    - [ ] Should handle network errors
    - [ ] Should include auth headers when available
  });
  
  describe('Authentication', () => {
    - [ ] Should store tokens in localStorage
    - [ ] Should include auth headers in requests
    - [ ] Should handle token expiration
  });
});
```

## 3. Integration Testing

### Full User Flow Tests
```typescript
// tests/integration/ai-generation-flow.test.ts
describe('AI Generation Integration Flow', () => {
  - [ ] Navigate to CreateGame page
  - [ ] Enter theme and select style
  - [ ] Click Generate and wait for completion
  - [ ] Verify 25 images appear in grid
  - [ ] Select exactly 20 images
  - [ ] Click Create Game
  - [ ] Verify navigation to Game page
  - [ ] Select difficulty
  - [ ] Start game with custom images
  - [ ] Verify game works with selected images
});
```

### API-Frontend Integration
```typescript
describe('Backend-Frontend Integration', () => {
  - [ ] Mock API responses for consistent testing
  - [ ] Test error handling across components
  - [ ] Verify data flow from API to UI
  - [ ] Test authentication state management
});
```

## 4. End-to-End Testing

### Cypress E2E Tests
```typescript
// cypress/e2e/ai-theme-creation.cy.ts
describe('AI Theme Creation E2E', () => {
  - [ ] Complete theme creation workflow
  - [ ] Test responsive design on different viewports
  - [ ] Test keyboard navigation
  - [ ] Test image selection interactions
  - [ ] Test error states and recovery
  - [ ] Test browser back/forward navigation
});
```

### Visual Regression Tests
```typescript
describe('Visual Regression Tests', () => {
  - [ ] CreateGame page matches Figma design
  - [ ] Image grid layout consistency
  - [ ] Loading states appearance
  - [ ] Error message styling
  - [ ] Mobile responsive layouts
});
```

## 5. Performance Testing

### Load Testing
```typescript
describe('Performance Tests', () => {
  - [ ] Image grid rendering with 25 images
  - [ ] Memory usage during image selection
  - [ ] Network request optimization
  - [ ] Bundle size impact of new features
  - [ ] Image loading performance
});
```

### Accessibility Testing
```typescript
describe('Accessibility Tests', () => {
  - [ ] Screen reader compatibility
  - [ ] Keyboard navigation support
  - [ ] Color contrast compliance
  - [ ] Focus management during interactions
  - [ ] ARIA labels and descriptions
});
```

## 6. Testing Infrastructure Setup

### Required Testing Dependencies
```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "cypress": "^12.0.0",
    "jest": "^29.0.0",
    "msw": "^1.0.0", // Mock Service Worker for API mocking
    "jest-environment-jsdom": "^29.0.0"
  }
}
```

### Test Configuration Files
- [ ] `jest.config.js` - Unit test configuration
- [ ] `cypress.config.ts` - E2E test configuration  
- [ ] `setupTests.ts` - Test environment setup
- [ ] `mocks/handlers.ts` - API mock definitions

## 7. Testing Priorities

### High Priority (Must Complete)
1. **Theme Generation API Tests** - Core functionality
2. **Image Selection Component Tests** - Critical user interaction
3. **Integration Flow Tests** - End-to-end workflow
4. **Error Handling Tests** - User experience protection

### Medium Priority (Should Complete)
1. **Authentication Tests** - Security validation
2. **Performance Tests** - User experience optimization
3. **Responsive Design Tests** - Multi-device support
4. **Accessibility Tests** - Inclusive design

### Low Priority (Nice to Have)
1. **Visual Regression Tests** - Design consistency
2. **Load Testing** - Scalability validation
3. **Browser Compatibility Tests** - Cross-browser support

## 🎯 Testing Execution Plan

### Phase 1: Core Functionality (Week 1)
- [ ] Set up testing infrastructure
- [ ] Write and run API handler tests
- [ ] Test CreateGame page interactions
- [ ] Validate image selection logic

### Phase 2: Integration & Flow (Week 2)
- [ ] End-to-end user flow tests
- [ ] API-Frontend integration tests
- [ ] Error handling validation
- [ ] Performance baseline tests

### Phase 3: Polish & Edge Cases (Week 3)
- [ ] Accessibility testing
- [ ] Visual regression tests
- [ ] Mobile device testing
- [ ] Browser compatibility validation

This comprehensive testing plan ensures the AI image generation feature is robust, user-friendly, and production-ready.