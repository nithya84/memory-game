# Customizable Memory Game

A customizable memory game designed for children on the autism spectrum that uses AI to generate themed images based on their special interests.

## 🎯 Current Status

### ✅ Phase 1: Core Memory Game - Complete
- Complete game mechanics with 3-20 card pair support
- Smooth 3D flip animations and responsive design
- Comprehensive test coverage (28 tests)
- Accessibility features and mobile support

### 🚧 Phase 2A: Backend Infrastructure - Partial
- ✅ Backend deployed to AWS (Lambda functions working)
- ✅ API endpoints responding with mock data
- ✅ Frontend UI for custom theme creation (local only)
- ❌ Frontend AWS deployment (blocked by permission issues)
- ❌ DynamoDB functionality (schema defined, not tested)
- ❌ Real Bedrock AI integration (mock service only)
- ⚠️ Security review needed

### 🔄 Next: Phase 2B
- Resolve AWS deployment permissions
- Test DynamoDB operations
- Switch from mock to real Bedrock AI
- Security audit and hardening

## Project Structure

```
memory_game/
├── frontend/          # React frontend application
├── backend/           # AWS Lambda backend functions
├── shared/            # Shared types and utilities
├── docs/              # Project documentation
├── package.json       # Root package.json for workspace management
└── README.md         # This file
```

## Development Setup

### Prerequisites

- Node.js 18+ and npm 9+
- AWS CLI configured (for deployment only)

### Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start frontend only (working game)
npm run dev:frontend

# Start backend locally (mock AI service)
npm run dev:backend
```

**Note:** Full deployment requires AWS permissions setup. See [README-DEPLOYMENT.md](./README-DEPLOYMENT.md) for deployment guide.

### Development Commands

```bash
# Start both frontend and backend in development mode
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Build for production
npm run build

# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### Testing Commands

```bash
# Run all tests (frontend + backend)
npm test

# Run frontend tests only
npm run test:frontend

# Run backend tests only
npm run test:backend

# Run tests in watch mode (for development)
npm run test:watch

# Run quick smoke tests (basic functionality check)
npm run smoke-test
```

### Testing Setup

This project uses a **minimal but effective testing strategy** focused on preventing breaking changes:

- **Frontend**: Vitest + React Testing Library for component tests
- **Backend**: Jest + AWS SDK mocks for Lambda function tests
- **Philosophy**: Test critical functionality, not everything

**Key testing practices:**
- ✅ Always test core game logic and user flows
- ✅ Test API endpoints and error handling  
- ✅ Ensure components render without crashing
- ❌ Don't over-test styling or third-party libraries

See [docs/TESTING.md](./docs/TESTING.md) for detailed testing guide.

## Workspaces

This project uses npm workspaces to manage the monorepo structure:

- **frontend**: React application with Vite
- **backend**: AWS Lambda functions with Serverless Framework
- **shared**: Shared TypeScript types and utilities

## Architecture

- **Frontend**: React 18 with TypeScript, Vite, and Emotion for styling
- **Backend**: Node.js AWS Lambda functions with TypeScript
- **Database**: Amazon DynamoDB
- **AI**: Amazon Bedrock for image generation
- **Storage**: Amazon S3 with CloudFront CDN
- **Authentication**: JWT-based authentication

## Features

### ✅ Working Features
- **Memory Game**: Complete gameplay with 3-20 card pairs
- **Animations**: 3D card flip transitions
- **Responsive Design**: Works on mobile, tablet, desktop
- **Accessibility**: Keyboard navigation, screen reader support
- **Custom Themes**: Frontend UI (local development only)
- **Backend API**: Deployed to AWS with mock AI service

### 🚧 In Development
- **Real AI Integration**: Bedrock image generation (coded, not tested)
- **Database**: DynamoDB operations (schema ready, not tested)
- **Deployment**: Frontend to AWS (blocked by permissions)
- **Security**: Authentication and data protection audit needed

## Development Status

**Phase 1: Core Game - ✅ Complete**
- ✅ Memory game with full functionality
- ✅ 28 comprehensive tests passing
- ✅ Responsive design and accessibility

**Phase 2A: Backend Infrastructure - 🚧 Partial**
- ✅ AWS Lambda functions deployed and working
- ✅ Custom theme creation UI (local frontend)
- ✅ Mock AI service responding correctly
- ❌ Frontend AWS deployment (permission issues)
- ❌ DynamoDB operations (not tested)
- ❌ Real Bedrock AI (not tested)

**Next Steps:**
- Fix AWS deployment permissions
- Test database operations
- Security review and hardening
- Switch to production AI service

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new features
3. Update documentation as needed
4. Ensure all linting and tests pass before submitting PRs

## License

Private project for educational purposes.