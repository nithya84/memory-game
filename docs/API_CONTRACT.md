# Backend API Contract: Customizable Memory Game

## API Overview

Base URL: `https://api.memorygame.app/v1`

**Authentication:** Bearer token (JWT)
**Rate Limiting:** 100 requests/minute for general endpoints, 10/minute for AI generation
**Content-Type:** `application/json`

## Authentication & Authorization

### User Registration
```http
POST /auth/register
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "securePassword123",
  "userType": "parent", // "parent" | "child"
  "parentPin": "1234" // Required for parent accounts
}

Response 201:
{
  "user": {
    "id": "usr_123",
    "email": "parent@example.com",
    "userType": "parent",
    "createdAt": "2024-06-21T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "securePassword123"
}

Response 200:
{
  "user": {
    "id": "usr_123",
    "email": "parent@example.com",
    "userType": "parent"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Parent PIN Verification
```http
POST /auth/verify-pin
Authorization: Bearer {token}
Content-Type: application/json

{
  "pin": "1234"
}

Response 200:
{
  "verified": true,
  "parentToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Enhanced permissions
}
```

## Theme Management

### Generate Images for Theme
```http
POST /themes/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "theme": "dinosaurs",
  "imageCount": 12, // Number of unique images needed
  "style": "cartoon" // "cartoon" | "realistic" | "simple"
}

Response 202: // Async operation started
{
  "generationId": "gen_456",
  "status": "processing",
  "estimatedTime": 30 // seconds
}
```

### Check Generation Status
```http
GET /themes/generate/{generationId}
Authorization: Bearer {token}

Response 200: // Still processing
{
  "generationId": "gen_456",
  "status": "processing", // "processing" | "completed" | "failed"
  "progress": 75, // percentage
  "estimatedTimeRemaining": 8
}

Response 200: // Completed
{
  "generationId": "gen_456",
  "status": "completed",
  "theme": "dinosaurs",
  "images": [
    {
      "id": "img_789",
      "url": "https://cdn.memorygame.app/images/img_789.webp",
      "thumbnailUrl": "https://cdn.memorygame.app/thumbs/img_789.webp",
      "altText": "T-Rex dinosaur",
      "safetyScore": 0.95
    }
    // ... more images
  ]
}
```

### Get Saved Themes
```http
GET /themes
Authorization: Bearer {token}

Response 200:
{
  "themes": [
    {
      "id": "theme_123",
      "name": "dinosaurs",
      "imageCount": 12,
      "createdAt": "2024-06-21T10:00:00Z",
      "lastUsed": "2024-06-21T15:30:00Z",
      "thumbnailUrl": "https://cdn.memorygame.app/thumbs/theme_123.webp"
    }
  ]
}
```

### Get Theme Details
```http
GET /themes/{themeId}
Authorization: Bearer {token}

Response 200:
{
  "id": "theme_123",
  "name": "dinosaurs",
  "images": [
    {
      "id": "img_789",
      "url": "https://cdn.memorygame.app/images/img_789.webp",
      "thumbnailUrl": "https://cdn.memorygame.app/thumbs/img_789.webp",
      "altText": "T-Rex dinosaur",
      "selected": true // User's selection for games
    }
    // ... more images
  ],
  "createdAt": "2024-06-21T10:00:00Z"
}
```

## Game Management

### Create Game Configuration
```http
POST /games
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Dinosaur Memory Game",
  "themeId": "theme_123",
  "selectedImages": ["img_789", "img_790", "img_791"], // Array of image IDs
  "pairCount": 6, // 3-20 pairs
  "settings": {
    "soundEnabled": true,
    "removeMatched": false, // Remove matched pairs vs keep visible
    "showProgress": true
  }
}

Response 201:
{
  "game": {
    "id": "game_456",
    "name": "Dinosaur Memory Game",
    "themeId": "theme_123",
    "pairCount": 6,
    "settings": {
      "soundEnabled": true,
      "removeMatched": false,
      "showProgress": true
    },
    "createdAt": "2024-06-21T10:00:00Z"
  }
}
```

### Get User's Games
```http
GET /games
Authorization: Bearer {token}

Response 200:
{
  "games": [
    {
      "id": "game_456",
      "name": "Dinosaur Memory Game",
      "themeName": "dinosaurs",
      "pairCount": 6,
      "timesPlayed": 3,
      "bestTime": 45.6,
      "lastPlayed": "2024-06-21T15:30:00Z",
      "thumbnailUrl": "https://cdn.memorygame.app/thumbs/game_456.webp"
    }
  ]
}
```

### Get Game Configuration
```http
GET /games/{gameId}
Authorization: Bearer {token}

Response 200:
{
  "id": "game_456",
  "name": "Dinosaur Memory Game",
  "pairCount": 6,
  "images": [
    {
      "imageId": "img_789",
      "imageUrl": "https://cdn.memorygame.app/images/img_789.webp",
      "altText": "T-Rex dinosaur",
    },
    {
      "imageId": "img_789",
      "imageUrl": "https://cdn.memorygame.app/images/img_789.webp",
      "altText": "T-Rex dinosaur",
    }
    // ... 6 images for 6 pairs.
  ],
  "settings": {
    "soundEnabled": true,
    "removeMatched": false,
    "showProgress": true
  }
}
```

## Game Sessions

### Start Game Session
```http
POST /sessions
Authorization: Bearer {token}
Content-Type: application/json

{
  "gameId": "game_456"
}

Response 201:
{
  "session": {
    "id": "session_789",
    "gameId": "game_456",
    "startTime": "2024-06-21T16:00:00Z",
    "status": "active" // "active" | "paused" | "completed"
  }
}
```

### Update Game Session
```http
PUT /sessions/{sessionId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "moves": [
    {
      "cardId": "card_1",
      "timestamp": "2024-06-21T16:00:15Z"
    },
    {
      "cardId": "card_2",
      "timestamp": "2024-06-21T16:00:17Z",
      "matched": true,
      "pairId": "pair_1"
    }
  ],
  "status": "active" // "active" | "paused" | "completed"
}

Response 200:
{
  "session": {
    "id": "session_789",
    "currentMoves": 1,
    "matchedPairs": 1,
    "totalPairs": 6,
    "elapsedTime": 45.6,
    "status": "active"
  }
}
```

### Complete Game Session
```http
POST /sessions/{sessionId}/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "completionTime": 78.4,
  "totalMoves": 14,
  "matchedPairs": 6
}

Response 200:
{
  "session": {
    "id": "session_789",
    "completionTime": 78.4,
    "totalMoves": 14,
    "efficiency": 0.86, // matchedPairs / (totalMoves / 2)
    "status": "completed",
    "personalBest": true
  }
}
```

## Analytics (Parent Access Only)

### Get Child's Performance Summary
```http
GET /analytics/performance
Authorization: Bearer {parentToken}
Query: ?timeRange=30d&childId=usr_child_123

Response 200:
{
  "summary": {
    "totalGamesPlayed": 45,
    "averageCompletionTime": 62.3,
    "averageEfficiency": 0.78,
    "improvementTrend": "improving", // "improving" | "stable" | "declining"
    "favoriteThemes": ["dinosaurs", "trains", "space"]
  },
  "weeklyStats": [
    {
      "week": "2024-06-15",
      "gamesPlayed": 8,
      "averageTime": 58.2,
      "efficiency": 0.82
    }
    // ... more weeks
  ]
}
```

### Get Detailed Game History
```http
GET /analytics/games
Authorization: Bearer {parentToken}
Query: ?childId=usr_child_123&limit=20&offset=0

Response 200:
{
  "games": [
    {
      "sessionId": "session_789",
      "gameName": "Dinosaur Memory Game",
      "pairCount": 6,
      "completionTime": 78.4,
      "moves": 14,
      "efficiency": 0.86,
      "playedAt": "2024-06-21T16:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## User Preferences

### Get User Settings
```http
GET /users/settings
Authorization: Bearer {token}

Response 200:
{
  "settings": {
    "soundEnabled": true,
    "soundVolume": 0.7,
    "colorTheme": "calm", // "calm" | "dark" | "high-contrast"
    "fontSize": "medium", // "small" | "medium" | "large"
    "animationsEnabled": true,
    "autoSave": true
  }
}
```

### Update User Settings
```http
PUT /users/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "soundEnabled": false,
  "colorTheme": "dark",
  "fontSize": "large"
}

Response 200:
{
  "settings": {
    "soundEnabled": false,
    "soundVolume": 0.7,
    "colorTheme": "dark",
    "fontSize": "large",
    "animationsEnabled": true,
    "autoSave": true
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "INVALID_THEME",
    "message": "The specified theme could not be processed",
    "details": "Theme must be between 1-50 characters and contain only letters, numbers, and spaces",
    "timestamp": "2024-06-21T16:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED` (401)
- `INSUFFICIENT_PERMISSIONS` (403)
- `RESOURCE_NOT_FOUND` (404)
- `RATE_LIMIT_EXCEEDED` (429)
- `INVALID_INPUT` (400)
- `THEME_GENERATION_FAILED` (422)
- `CONTENT_MODERATION_FAILED` (422)
- `SERVICE_UNAVAILABLE` (503)

## Rate Limiting

### Limits by Endpoint
- **General API**: 100 requests/minute per user
- **Image Generation**: 1 requests/hour per user
- **Analytics**: 30 requests/minute per parent account

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 60
```

## Webhooks (Future Enhancement)

### Game Completion Webhook
```http
POST {webhook_url}
Content-Type: application/json
X-Webhook-Signature: sha256=...

{
  "event": "game.completed",
  "userId": "usr_123",
  "sessionId": "session_789",
  "completionTime": 78.4,
  "personalBest": true,
  "timestamp": "2024-06-21T16:00:00Z"
}
```

## Data Models Summary

### User
```typescript
interface User {
  id: string;
  email: string;
  userType: 'parent' | 'child';
  parentId?: string; // For child accounts
  parentPin?: string; // Hashed, for parent accounts
  createdAt: string;
  lastLoginAt: string;
  settings: UserSettings;
}
```

### Theme
```typescript
interface Theme {
  id: string;
  userId: string;
  name: string;
  images: ThemeImage[];
  createdAt: string;
  lastUsed: string;
}

interface ThemeImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  altText: string;
  safetyScore: number;
  selected: boolean;
}
```

### Game
```typescript
interface Game {
  id: string;
  userId: string;
  name: string;
  themeId: string;
  selectedImages: string[]; // Image IDs
  pairCount: number;
  settings: GameSettings;
  createdAt: string;
  timesPlayed: number;
  bestTime?: number;
  lastPlayed?: string;
}
```

### Session
```typescript
interface Session {
  id: string;
  userId: string;
  gameId: string;
  startTime: string;
  endTime?: string;
  completionTime?: number;
  totalMoves: number;
  matchedPairs: number;
  status: 'active' | 'paused' | 'completed';
  moves: Move[];
}

interface Move {
  cardId: string;
  timestamp: string;
  matched?: boolean;
  pairId?: string;
}
```

## Security Considerations

### Data Protection
- All child data encrypted at rest
- Minimal data collection (COPPA compliant)
- Automatic data retention policies
- Parent-controlled data deletion

### API Security
- JWT tokens with 24-hour expiration
- Rate limiting to prevent abuse
- Input validation and sanitization
- SQL injection prevention
- Content Security Policy headers

### Image Safety
- Multi-layer content moderation
- Image scanning for inappropriate content
- User reporting mechanism
- Manual review queue for flagged content

This API contract provides a comprehensive foundation for the Customizable Memory Game backend, ensuring security, scalability, and compliance with child privacy regulations.