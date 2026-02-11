# Memory Game - Progress Document

Last updated: January 28, 2026

## Current State

### ✅ Completed & Deployed

**Core Game:**
- Memory game fully functional (3-20 card pairs, 3D animations, win detection)
- Responsive design for mobile and desktop
- Keyboard navigation and accessibility features
- Game statistics tracking (moves, time, completion)

**Backend (AWS):**
- Public API deployed: `https://cr03bj6k02.execute-api.us-east-1.amazonaws.com/dev`
- Endpoints: GET /health, GET /themes, GET /themes/{id}
- Admin API available (not auto-deployed for cost control)
- DynamoDB themes table
- S3 image storage with CloudFront CDN

**Frontend (AWS):**
- Deployed to CloudFront: `https://d19me0v65pp4hx.cloudfront.net`
- Configured for `/memory-game` subdirectory path
- SEO meta tags for neurodivergent children and families
- Canonical URL to prevent duplicate content

**Portfolio Landing Page:**
- Separate GitHub repo: `https://github.com/nithya84/enable-kids`
- Landing page focused on neurodivergent families
- Email signup form (Web3Forms → nithya@enable.kids)
- Reverse proxy configuration for /memory-game route
- SEO optimized (robots.txt, sitemap.xml, structured data)
- Ready for Cloudflare Pages deployment

### Architecture

```
enable.kids/                    → Portfolio landing page (Cloudflare Pages)
  └── /memory-game             → Proxy to CloudFront game

CloudFront (d19me0v65pp4hx...) → Memory game frontend
  └── API calls to             → Lambda functions + DynamoDB
```

### Deployment Structure

**Memory Game Repo:** `nithya84/memory-game`
- Frontend + Backend + Admin tool
- Deployed to AWS (dev environment)

**Portfolio Repo:** `nithya84/enable-kids`
- Landing page, email signup, SEO
- Ready for Cloudflare Pages

## Environment Setup

### Backend Configuration

**File:** `backend/.env` (gitignored)

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
THEMES_TABLE=memory-game-api-themes-dev
S3_BUCKET_NAME=memory-game-images-dev
ADMIN_TOKEN_DEV=<your-token>
```

### Frontend Configuration

**File:** `frontend/.env` (gitignored)

```bash
VITE_API_BASE_URL=https://cr03bj6k02.execute-api.us-east-1.amazonaws.com/dev
```

## Deployed AWS Resources (dev)

| Resource | Value |
|----------|-------|
| Public API | `https://cr03bj6k02.execute-api.us-east-1.amazonaws.com/dev` |
| CloudFront | `https://d19me0v65pp4hx.cloudfront.net` |
| DynamoDB Table | `memory-game-api-themes-dev` |
| S3 Images Bucket | `memory-game-images-dev` |
| S3 Frontend Bucket | `memory-game-frontend-dev` |

## How to Deploy

### Deploy Backend + Frontend
```bash
./deploy.sh dev
```

This deploys:
1. Backend public API (Lambda functions)
2. Frontend to S3 + CloudFront

### Deploy Admin API (Optional)
```bash
./deploy.sh dev yes
```

⚠️ Admin API includes expensive Bedrock AI operations (~$1-3 per theme generation)

### Deploy Portfolio Landing Page

1. Go to Cloudflare Pages dashboard
2. Connect GitHub repo: `enable-kids`
3. Configure: Build directory = `/` (root)
4. Add custom domain: `enable.kids`
5. DNS propagation (1-48 hours)

## Local Development

### Run Game Locally
```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

### Run Backend Locally
```bash
cd backend
npm run dev
# API at http://localhost:3001
```

### Admin Tool
Admin UI available at `/admin` route (requires ADMIN_TOKEN)

## API Endpoints

### Public API
- `GET /health` - Health check
- `GET /themes` - List curated themes
- `GET /themes/{id}` - Get theme images

### Admin API (requires Bearer token)
- `GET /admin/themes` - List all themes (draft + curated)
- `GET /admin/themes/{id}` - Get single theme by ID
- `POST /admin/themes/generate` - Generate theme with AI (expensive: 35+ Bedrock calls)
- `PUT /admin/themes/{id}/curate` - Curate theme (select final images)
- `POST /admin/themes/consolidate` - Consolidate multiple themes into one
- `PUT /admin/themes/{id}/preview` - Update preview image for theme
- `DELETE /admin/themes/{id}` - Delete theme and cleanup images

## Project Structure

```
memory_game/
├── backend/
│   ├── serverless.yml           # Public API config
│   ├── serverless-admin.yml     # Admin API config
│   └── src/handlers/
│       ├── themes-public.ts     # Public endpoints
│       └── admin.ts             # Admin endpoints (AI generation)
├── frontend/
│   ├── index.html               # SEO meta tags
│   └── src/
│       ├── pages/
│       │   ├── Game.tsx         # Main game page
│       │   └── Admin.tsx        # Admin UI
│       └── components/
│           ├── GameBoard.tsx    # Game logic
│           └── Card.tsx         # Card component
├── docs/
│   ├── PROGRESS.md              # This file
│   ├── API_CONTRACT.md          # API documentation
│   ├── CLOUDFLARE_SETUP_GUIDE.md
│   └── SEO_IMPROVEMENTS_PLAN.md
└── deploy.sh                    # Deployment script
```

## Security Notes

- AWS credentials in `.env` are gitignored
- Admin token required for AI generation endpoints
- Web3Forms access key is public (safe by design - only sends to nithya@enable.kids)
- Canonical URLs prevent duplicate content SEO issues

## Next Steps

### Immediate
- [ ] Deploy portfolio to Cloudflare Pages
- [ ] Test enable.kids/memory-game proxy routing
- [ ] Verify email signup form

### Future Features
- [ ] Theme Gallery - Browse pre-generated themes
- [ ] Game Persistence - Save game progress
- [ ] Parent Dashboard - Analytics and progress tracking
- [ ] Sound controls - Volume adjustment
- [ ] High contrast mode - Accessibility option
- [ ] Multiple difficulty presets

## SEO Status

**Memory Game:**
- ✅ Meta tags added (title, description, canonical URL)
- ✅ Configured for /memory-game subdirectory

**Portfolio:**
- ✅ SEO-optimized landing page
- ✅ robots.txt and sitemap.xml
- ✅ Open Graph and Twitter Card meta tags
- ✅ JSON-LD structured data
- ✅ Email signup form with Web3Forms

## Known Issues

None currently tracked. Game is stable and deployed.

## Recent Changes (January 2026)

- Separated portfolio into dedicated GitHub repo
- Added SEO meta tags focused on neurodivergent families
- Configured game for subdirectory deployment
- Integrated Web3Forms for email signups
- Updated documentation structure
