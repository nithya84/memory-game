# Customizable Memory Game

A customizable memory game designed for children on the autism spectrum that uses AI to generate themed images based on their special interests.

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
- AWS CLI configured with appropriate permissions
- Access to Amazon Bedrock service

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   cp frontend/.env.example frontend/.env.local
   ```

4. Fill in the environment variables with your AWS credentials and configuration

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

- Customizable memory game with AI-generated themed images
- Autism-friendly design with calm colors and clear interface
- Parent dashboard with analytics and game management
- Responsive design for tablets and mobile devices
- Accessibility features including keyboard navigation

## Sprint Progress

Currently in Sprint 1: Foundation & Core Logic
- ✅ Repository structure setup
- ⏳ Backend infrastructure setup
- ⏳ Frontend application setup
- ⏳ Core game logic implementation

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new features
3. Update documentation as needed
4. Ensure all linting and tests pass before submitting PRs

## License

Private project for educational purposes.