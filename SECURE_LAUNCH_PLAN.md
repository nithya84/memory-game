# Secure Public Launch Plan

**Created:** 2026-01-05
**Objective:** Deploy Memory Game publicly with zero risk of runaway AWS costs

---

## 🎯 Strategy Overview

Launch with **pre-generated themes only** and **no public admin access**. This eliminates all risk of unauthorized AI generation while providing a fully functional game.

---

## 📋 Phase 1: Pre-Launch Preparation

### Step 1: Test Admin API Locally ✓
**Goal:** Verify theme generation works before deploying

```bash
# Start backend locally
cd backend
npm install
npm run dev

# Test admin endpoint
curl -X POST http://localhost:3001/admin/themes/generate \
  -H "Authorization: Bearer admin-local-token-for-testing" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dinosaurs","style":"cartoon","count":35}'
```

**Expected:** Returns theme with 35 generated images (mocked in local mode)

---

### Step 2: Generate 10 Production Themes
**Goal:** Create initial theme library for launch

**Themes to Generate:**
1. Dinosaurs (cartoon style)
2. Ocean Animals (cartoon style)
3. Space (realistic style)
4. Farm Animals (cartoon style)
5. Vehicles (simple style)
6. Fruits (cartoon style)
7. Musical Instruments (simple style)
8. Sports Equipment (cartoon style)
9. Birds (realistic style)
10. Shapes & Colors (simple style)

**Process:**
```bash
# Set USE_MOCK_AI=false in .env.local
# Deploy backend to dev
cd backend
serverless deploy --stage dev

# Generate each theme
curl -X POST https://[dev-api-url]/admin/themes/generate \
  -H "Authorization: Bearer [ADMIN_TOKEN_DEV]" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dinosaurs","style":"cartoon","count":35}'

# Curate each theme (select 20 best images)
curl -X PUT https://[dev-api-url]/admin/themes/{themeId}/curate \
  -H "Authorization: Bearer [ADMIN_TOKEN_DEV]" \
  -H "Content-Type: application/json" \
  -d '{"selectedImageIds":["img1","img2",...]}'

# Repeat for all 10 themes
```

**Estimated Cost:** $5-10 one-time (10 themes × 35 images × $0.01-0.03/image)

---

### Step 3: Secure serverless.yml Configuration
**Goal:** Remove admin endpoints from production deployment

**Changes to `backend/serverless.yml`:**

#### 3a. Create Separate Stage Configs

```yaml
# Add to custom section
custom:
  stages:
    dev:
      deployAdminEndpoints: true   # Keep admin in dev
    prod:
      deployAdminEndpoints: false  # Remove admin in prod
```

#### 3b. Conditional Admin Endpoints

```yaml
functions:
  # Only deploy admin functions in dev stage
  generateTheme:
    handler: dist/src/handlers/admin.generateThemeForCuration
    timeout: 300
    events:
      - http:
          path: /admin/themes/generate
          method: post
          cors:
            origin: ${self:custom.corsOrigin.${self:provider.stage}}
            headers:
              - Content-Type
              - Authorization
    # Conditional deployment
    condition: ${self:custom.stages.${self:provider.stage}.deployAdminEndpoints, false}

  curateTheme:
    handler: dist/src/handlers/admin.curateTheme
    events:
      - http:
          path: /admin/themes/{themeId}/curate
          method: put
          cors:
            origin: ${self:custom.corsOrigin.${self:provider.stage}}
            headers:
              - Content-Type
              - Authorization
    condition: ${self:custom.stages.${self:provider.stage}.deployAdminEndpoints, false}

  listThemes:
    handler: dist/src/handlers/admin.listThemes
    events:
      - http:
          path: /admin/themes
          method: get
          cors:
            origin: ${self:custom.corsOrigin.${self:provider.stage}}
            headers:
              - Authorization
    condition: ${self:custom.stages.${self:provider.stage}.deployAdminEndpoints, false}
```

#### 3c. Lock Down CORS

```yaml
custom:
  corsOrigin:
    dev: '*'  # Allow all origins in dev
    prod: 'https://your-production-domain.com'  # Specific domain in prod
```

#### 3d. Add Rate Limiting

```yaml
provider:
  apiGateway:
    throttle:
      rateLimit: 50      # 50 requests per second (generous for public)
      burstLimit: 100    # Allow bursts up to 100

functions:
  getThemes:
    handler: dist/src/handlers/themes-public.getThemes
    throttle:
      rateLimit: 10      # Lower limit for list endpoint
      burstLimit: 20
```

---

### Step 4: Set Up AWS Billing Alerts
**Goal:** Get notified before costs become a problem

**AWS Console Steps:**
1. Go to AWS Billing Console → Budgets
2. Create Budget:
   - Type: Cost budget
   - Name: memory-game-monthly-budget
   - Period: Monthly
   - Budgeted amount: $50
3. Add Alerts:
   - Alert 1: 50% threshold ($25) → Email notification
   - Alert 2: 80% threshold ($40) → Email notification
   - Alert 3: 100% threshold ($50) → Email notification + SNS topic
4. Optional: Create SNS topic to disable API Gateway if exceeded

---

## 🚀 Phase 2: Deployment

### Step 5: Deploy Backend to Production

```bash
cd backend

# Ensure production environment is configured
# .env.local should have ADMIN_TOKEN_PROD set

# Build
npm run build

# Deploy to prod (admin endpoints excluded)
serverless deploy --stage prod

# Note the API Gateway URL
# Example: https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

**Verify:**
```bash
# Health check should work
curl https://[prod-api-url]/health

# Public endpoints should work
curl https://[prod-api-url]/themes

# Admin endpoints should return 404
curl https://[prod-api-url]/admin/themes
# Expected: 404 or {"message":"Not Found"}
```

---

### Step 6: Deploy Frontend to Production

```bash
cd frontend

# Update .env.production with prod API URL
echo "VITE_API_BASE_URL=https://[prod-api-url]" > .env.production

# Build for production
npm run build

# Deploy to S3
aws s3 sync dist/ s3://memory-game-frontend-prod/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id [CLOUDFRONT_DIST_ID] \
  --paths "/*"
```

**Get CloudFront URL:**
```bash
serverless info --stage prod
# Look for CloudFrontDomainName output
```

---

### Step 7: End-to-End Testing

**Test Checklist:**
- [ ] Visit CloudFront URL → Homepage loads
- [ ] Theme gallery shows 10 themes
- [ ] Click theme → Difficulty selection appears
- [ ] Select difficulty → Game starts
- [ ] Images load from CloudFront
- [ ] Game functionality works (flip, match, win)
- [ ] Try on mobile device
- [ ] Check browser console for errors
- [ ] Verify no 404s in Network tab

---

## 🔒 Security Verification

### Post-Deployment Security Audit

```bash
# 1. Verify admin endpoints are NOT accessible
curl https://[prod-api-url]/admin/themes/generate
# Expected: 404 or 403

# 2. Verify CORS is locked down
curl -H "Origin: https://malicious-site.com" \
  https://[prod-api-url]/themes
# Should NOT have Access-Control-Allow-Origin: *

# 3. Check rate limiting
for i in {1..100}; do
  curl https://[prod-api-url]/themes
done
# Should eventually return 429 Too Many Requests

# 4. Verify CloudFront serves images
curl -I https://[cloudfront-url]/images/[some-image-id].png
# Should return 200 with CloudFront headers
```

---

## 📊 Monitoring & Maintenance

### Daily (First Week)
- Check AWS billing dashboard
- Review CloudWatch logs for errors
- Monitor traffic patterns

### Weekly
- Review cost breakdown
- Check for unusual API usage
- Verify all themes load correctly

### Monthly
- Generate 2-3 new themes (via dev environment)
- Curate and publish to prod
- Review user engagement metrics (if tracking added)

---

## 🆘 Emergency Procedures

### If AWS Bill Spikes

**Immediate Actions:**
1. Check CloudWatch logs for unusual activity
2. Disable API Gateway:
   ```bash
   aws apigateway update-rest-api \
     --rest-api-id [API_ID] \
     --patch-operations op=replace,path=/disableExecuteApiEndpoint,value=true
   ```
3. Investigate source of traffic
4. Contact AWS support if suspected abuse

### If Admin Token Leaked

**If you accidentally commit admin token to git:**
1. Immediately rotate token:
   ```bash
   # Generate new token
   openssl rand -base64 32

   # Update .env.local
   ADMIN_TOKEN_DEV=new-token-here

   # Redeploy dev environment
   serverless deploy --stage dev
   ```
2. Remove from git history:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   ```

---

## 💰 Expected Costs

### Initial Setup (One-time)
- Theme generation (10 themes × 35 images): **$5-10**

### Monthly Operating Costs (1,000 users)
| Service | Cost |
|---------|------|
| CloudFront | $5-15 |
| Lambda | $1-3 |
| DynamoDB | $1-2 |
| S3 Storage | $1-5 |
| API Gateway | $3-7 |
| **Total** | **$11-32/month** |

### With Admin Endpoints Disabled
- **No risk of runaway AI generation costs** ✅
- Predictable, low monthly costs
- Can scale to 10,000+ users on same budget

---

## 🎯 Success Criteria

**Launch is successful when:**
- ✅ 10 themes available and loading
- ✅ Game works on desktop and mobile
- ✅ No errors in CloudWatch logs
- ✅ AWS costs < $50 in first month
- ✅ Admin endpoints return 404 in production
- ✅ CloudFront serving images efficiently
- ✅ Rate limiting prevents abuse

---

## 📝 Future Enhancements (Phase 3)

**After successful launch, consider adding:**
1. User authentication
2. Game history tracking
3. Parent dashboard
4. Custom theme requests (with moderation)
5. Analytics and usage tracking
6. Email notifications for new themes
7. Social sharing features

**For admin theme generation in production:**
- Deploy admin endpoints with AWS IAM authentication only
- Use AWS Console to invoke Lambda functions directly
- Keep HTTP endpoints disabled in prod

---

## 📞 Support & Resources

**Documentation:**
- AWS Serverless: https://www.serverless.com/framework/docs
- Amazon Bedrock: https://docs.aws.amazon.com/bedrock/
- CloudFront: https://docs.aws.amazon.com/cloudfront/

**Project Files:**
- Main config: `backend/serverless.yml`
- Frontend config: `frontend/vite.config.ts`
- Environment: `.env.local`, `.env.example`

**Helpful Commands:**
```bash
# View logs
serverless logs -f getThemes --stage prod

# Check deployment info
serverless info --stage prod

# Remove deployment
serverless remove --stage prod
```

---

**Last Updated:** 2026-01-05
**Next Review:** After successful deployment
