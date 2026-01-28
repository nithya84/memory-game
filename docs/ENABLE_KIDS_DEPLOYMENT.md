# enable.kids Portfolio Deployment Guide

## Status: ✅ Implementation Complete

## Overview

Set up enable.kids as a portfolio hub that routes to the memory game and future projects.

**Portfolio Repository:** https://github.com/nithya84/enable-kids

**Target Architecture:**
```
enable.kids/                 → Portfolio landing page
enable.kids/memory-game/*    → Proxy to existing CloudFront game
enable.kids/future-project/* → Future additions
```

---

## Approach: Cloudflare Pages + Workers

**Why Cloudflare:**
- Free tier covers everything needed
- Simple DNS setup from Gandi (change nameservers)
- Cloudflare Pages for portfolio hosting
- Cloudflare Workers for reverse proxy routing
- Easy to add new projects later

---

## Implementation Steps

### Step 1: Create Portfolio Landing Page ✅ COMPLETED

**Repository:** https://github.com/nithya84/enable-kids

Created files:
- `index.html` - Responsive landing page with enable.kids branding
- `styles.css` - Modern, kid-friendly styling with gradient backgrounds
- `_redirects` - Cloudflare Pages redirect rules for proxy
- `robots.txt` - Search engine crawling instructions
- `sitemap.xml` - Site structure for SEO

**Features:**
- Hero section with enable.kids branding
- Project cards with hover effects
- Memory Game card (active)
- "Coming Soon" placeholder for future projects
- Fully responsive mobile and desktop design

### Step 2: Set Up Cloudflare

1. Create free Cloudflare account at https://cloudflare.com
2. Add enable.kids site to Cloudflare
3. Cloudflare will provide nameservers (e.g., `nova.ns.cloudflare.com`, `rick.ns.cloudflare.com`)

### Step 3: Update Gandi DNS

1. Log into Gandi
2. Go to Domain Settings → Nameservers
3. Replace Gandi nameservers with Cloudflare's nameservers
4. Wait for propagation (24-48 hours, often faster)

### Step 4: Deploy Portfolio to Cloudflare Pages

1. In Cloudflare dashboard, go to Pages
2. Connect GitHub repo: **enable-kids** (https://github.com/nithya84/enable-kids)
3. Set build settings:
   - Build output directory: `/` (root directory)
   - No build command needed for static HTML
4. Add custom domain: `enable.kids`

### Step 5: Configure Reverse Proxy

**File:** `_redirects` in the enable-kids repo
```
/memory-game/*  https://d19me0v65pp4hx.cloudfront.net/:splat  200
/memory-game    https://d19me0v65pp4hx.cloudfront.net/        200
```

This proxies `/memory-game/*` requests to the existing CloudFront distribution.

**Note:** The `200` status code makes this a rewrite (proxy), not a redirect. Users stay on enable.kids URL.

---

## Alternative: Cloudflare Worker (More Control)

If the `_redirects` approach has limitations, use a Cloudflare Worker:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/memory-game')) {
      // Rewrite to CloudFront, stripping /memory-game prefix
      const newPath = url.pathname.replace('/memory-game', '') || '/';
      const newUrl = `https://d19me0v65pp4hx.cloudfront.net${newPath}${url.search}`;

      const response = await fetch(newUrl, {
        method: request.method,
        headers: request.headers,
      });

      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Default: serve from Pages (portfolio)
    return fetch(request);
  }
}
```

This approach:
- Strips `/memory-game` prefix before forwarding
- Preserves query strings
- Allows the game to work without base path changes

---

## Game Configuration ✅ COMPLETED

Updated the memory game to work at `/memory-game/` subdirectory:

**File:** `frontend/vite.config.ts`
```typescript
export default defineConfig({
  base: '/memory-game/',  // ✅ Added
  // ... rest of config
})
```

**File:** `frontend/src/App.tsx`
```typescript
<BrowserRouter basename="/memory-game">  // ✅ Added basename
```

**Next Step:** Redeploy the game with `./deploy.sh dev` to apply these changes.

---

## Adding Future Projects

To add a new project to the portfolio:

1. Deploy the project somewhere (Vercel, CloudFront, Netlify, etc.)
2. Add a redirect rule to `_redirects` in enable-kids repo:
   ```
   /new-project/*  https://new-project-url.com/:splat  200
   ```
3. Add a card to the portfolio landing page (`index.html`)
4. Commit and push to enable-kids repo to trigger Cloudflare Pages deployment

---

## Current Infrastructure Reference

| Resource | Value |
|----------|-------|
| CloudFront Domain | `d19me0v65pp4hx.cloudfront.net` |
| API Endpoint | `https://cr03bj6k02.execute-api.us-east-1.amazonaws.com/dev` |
| Frontend S3 Bucket | `memory-game-frontend-dev` |
| Images S3 Bucket | `memory-game-images-dev` |

---

## Verification Checklist

- [ ] Portfolio loads at `https://enable.kids/`
- [ ] Memory game loads at `https://enable.kids/memory-game`
- [ ] Game images and assets load correctly
- [ ] Game plays without errors
- [ ] In-game navigation works
- [ ] Mobile responsive

---

## Timeline

| Step | Duration |
|------|----------|
| Create portfolio page | 1-2 hours |
| Cloudflare account setup | 10 minutes |
| Gandi nameserver update | 5 minutes |
| DNS propagation | 1-48 hours |
| Cloudflare Pages deploy | 10 minutes |
| Testing & verification | 30 minutes |

---

## Rollback

If issues arise:
1. Revert Gandi nameservers to Gandi defaults
2. enable.kids will stop resolving (or revert to previous state)
3. Game remains accessible at CloudFront URL
