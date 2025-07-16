# Customizable Memory Game

A customizable memory game designed for children on the autism spectrum that uses AI to generate themed images based on their special interests.

## ✅ What Works Now

- **Memory Game**: Complete - play with 3-20 card pairs
- **AI Themes**: Generate custom themes with Amazon Bedrock
- **Deployed**: Frontend and backend running on AWS
- **Local Dev**: Mock AI for testing without AWS costs

## 🚧 TODO

- Parent dashboard for tracking progress
- User accounts and login
- Game settings and sound controls

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

### Testing

- Frontend: Vitest + React Testing Library
- Backend: Jest + AWS mocks
- 28 tests covering core functionality

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

### ✅ Working
- Memory game with animations
- AI-generated custom themes
- Mobile/desktop responsive
- Deployed to AWS

### 🚧 TODO
- Parent dashboard
- User accounts
- Game settings

## Development Status

**✅ Done**: Core game + AI themes + AWS deployment
**🚧 Next**: Parent dashboard, user accounts, settings

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new features
3. Update documentation as needed
4. Ensure all linting and tests pass before submitting PRs

## License

Private project for educational purposes.