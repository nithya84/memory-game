# Memory Game - Progress Document

Last updated: January 2026

## Current State

### Completed
- Core memory game fully functional (3-20 card pairs, animations, win detection)
- Admin UI for theme generation and curation (`/admin` route)
- Environment configuration simplified (single `.env` per directory)
- Deployed to AWS (dev environment)

### Environment Setup (Simplified)

**Before:** 9 scattered env files with local/dev/prod stages
**After:** 4 files total

| File | Purpose |
|------|---------|
| `.env.example` | Template - commit to git |
| `.env` | Actual config - gitignored |
| `frontend/.env.example` | Frontend template |
| `frontend/.env` | Frontend config - gitignored |

### Key Environment Variables

```bash
# Root .env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
THEMES_TABLE=memory-game-api-themes-dev
S3_BUCKET_NAME=memory-game-images-dev
ADMIN_TOKEN=<generate with: openssl rand -base64 32>
USE_MOCK_AI=true  # Set false to use real Bedrock

# Frontend .env
VITE_API_BASE_URL=http://localhost:3001/local
VITE_ADMIN_API_URL=http://localhost:3002/local
```

### Deployed AWS Resources (dev)

| Resource | Name |
|----------|------|
| DynamoDB Table | `memory-game-api-themes-dev` |
| S3 Bucket (images) | `memory-game-images-dev` |
| S3 Bucket (frontend) | `memory-game-frontend-dev` |
| CloudFront | Serves frontend + images |

## How to Run Locally

### Admin UI Development
```bash
# 1. Copy env template and configure
cp .env.example .env
# Edit .env with your values (especially ADMIN_TOKEN)

# 2. Run the startup script
./scripts/start-admin.sh
```

This starts:
- Admin backend on `http://localhost:3002`
- Frontend on `http://localhost:5173`
- Admin UI at `http://localhost:5173/admin`

### Just Frontend (no backend)
```bash
cd frontend && npm run dev
```

### Just Backend (public API)
```bash
cd backend && npm run dev
```

## Admin Authentication

Single `ADMIN_TOKEN` used for all environments. Set in:
- `.env` file for local development
- Lambda environment variables for deployed version

To use Admin UI:
1. Go to `http://localhost:5173/admin`
2. Enter the ADMIN_TOKEN value from your `.env`

## Serverless Configuration

Both `serverless.yml` and `serverless-admin.yml` now:
- Use env vars with `-dev` defaults (matches deployed resources)
- No multi-stage complexity
- Default stage is `local` for serverless-offline

Deploy commands:
```bash
cd backend
npm run deploy        # Deploy public API
npm run deploy:admin  # Deploy admin API
```

## Security Notes

- AWS credentials in `.env` are gitignored
- Real credentials should be rotated if exposed
- For production: use AWS SSO/IAM roles instead of access keys
- Consider LocalStack for fully isolated local development

## Project Structure

```
memory-game/
├── .env.example          # Backend env template
├── .env                  # Backend env (gitignored)
├── frontend/
│   ├── .env.example      # Frontend env template
│   ├── .env              # Frontend env (gitignored)
│   └── src/
│       ├── pages/Admin.tsx    # Admin UI
│       └── components/        # Game components
├── backend/
│   ├── serverless.yml         # Public API config
│   ├── serverless-admin.yml   # Admin API config
│   └── src/handlers/
│       ├── admin.ts           # Admin endpoints
│       └── themes-public.ts   # Public endpoints
├── scripts/
│   └── start-admin.sh    # Local dev startup
└── docs/
    └── PROGRESS.md       # This file
```

## Next Steps (Not Started)

1. **LocalStack Integration** - For fully isolated local dev without AWS costs
2. **Theme Gallery** - Display curated themes to users
3. **Game Persistence** - Save game progress
4. **Analytics** - Parent dashboard for tracking

## API Endpoints

### Public API (port 3001)
- `GET /themes` - List curated themes
- `GET /themes/{themeId}` - Get theme images

### Admin API (port 3002)
- `GET /admin/themes` - List all themes (draft + curated)
- `POST /admin/themes/generate` - Generate new theme with AI
- `PUT /admin/themes/{themeId}/curate` - Curate theme (select final images)

All admin endpoints require `Authorization: Bearer <ADMIN_TOKEN>` header.
