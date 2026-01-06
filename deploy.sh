#!/bin/bash

# Memory Game Deployment Script (Two-Service Architecture)
# Deploys both public API and (optionally) admin API
set -e

STAGE=${1:-dev}
DEPLOY_ADMIN=${2:-no}  # Default: don't deploy admin

echo "================================"
echo "Memory Game Deployment"
echo "Stage: $STAGE"
echo "Deploy Admin: $DEPLOY_ADMIN"
echo "================================"
echo ""

# Note about new architecture
echo "📦 Two-Service Architecture:"
echo "  1. Public API  (serverless.yml)      - Safe, read-only"
echo "  2. Admin API   (serverless-admin.yml) - Expensive AI operations"
echo ""

echo "1. Installing backend dependencies..."
cd backend
npm run clean
npm install

echo "2. Building backend..."
npm run build

echo "3. Deploying PUBLIC API (serverless.yml)..."
echo "   - GET /health"
echo "   - GET /themes"
echo "   - GET /themes/{id}"
echo ""
npm run deploy -- --stage $STAGE

if [ "$DEPLOY_ADMIN" = "yes" ]; then
  echo ""
  echo "⚠️  ADMIN API DEPLOYMENT REQUESTED"
  echo "================================"
  echo "This will deploy EXPENSIVE endpoints to stage: $STAGE"
  echo ""
  echo "Endpoints to be deployed:"
  echo "   - POST /admin/themes/generate (calls Bedrock 35+ times, ~\$1-3 per theme)"
  echo "   - PUT  /admin/themes/{id}/curate"
  echo "   - GET  /admin/themes"
  echo ""

  # Check admin token with proper variable expansion
  STAGE_UPPER=$(echo "$STAGE" | tr '[:lower:]' '[:upper:]')
  ADMIN_TOKEN_VAR="ADMIN_TOKEN_${STAGE_UPPER}"
  if [ -z "${!ADMIN_TOKEN_VAR}" ]; then
    echo "❌ ERROR: ${ADMIN_TOKEN_VAR} environment variable not set"
    echo "   Set via: export ${ADMIN_TOKEN_VAR}=your-secure-token"
    echo ""
    echo "Skipping admin API deployment for safety."
    DEPLOY_ADMIN="no"
  else
    echo "✓ ${ADMIN_TOKEN_VAR} is set"
    echo ""
    echo "⚠️  These endpoints will be publicly accessible (protected only by Bearer token)"
    echo "⚠️  Anyone with the token can generate themes and incur AWS costs"
    echo ""
    read -p "Are you SURE you want to deploy admin API to $STAGE? (type 'yes' to confirm): " CONFIRM

    if [ "$CONFIRM" = "yes" ]; then
      echo ""
      echo "4. Deploying ADMIN API (serverless-admin.yml)..."
      npm run deploy:admin -- --stage $STAGE
      echo "✅ Admin API deployed to $STAGE"
      echo ""
    else
      echo ""
      echo "❌ Admin API deployment cancelled (you must type 'yes' to confirm)"
      echo "   Continuing with public API only..."
      DEPLOY_ADMIN="no"
      echo ""
    fi
  fi
else
  echo ""
  echo "⏭️  Skipping admin API deployment (use './deploy.sh $STAGE yes' to deploy admin)"
fi

NEXT_STEP=$((DEPLOY_ADMIN == "yes" ? 5 : 4))
echo "${NEXT_STEP}. Cleaning and installing frontend dependencies..."
cd ../frontend
npm run clean
npm install

NEXT_STEP=$((NEXT_STEP + 1))
echo "${NEXT_STEP}. Building frontend..."
if [ "$STAGE" = "prod" ]; then
  npm run build
else
  npm run build -- --mode $STAGE
fi

NEXT_STEP=$((NEXT_STEP + 1))
echo "${NEXT_STEP}. Deploying frontend to S3..."
BUCKET_NAME="memory-game-frontend-$STAGE"
echo "   Uploading to s3://$BUCKET_NAME"
aws s3 sync dist/ s3://$BUCKET_NAME --delete --region us-east-1

echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""

# Get service endpoints
cd ../backend
echo "📍 Service Endpoints:"
echo ""

# Public API
PUBLIC_ENDPOINT=$(npx serverless info --stage $STAGE 2>/dev/null | grep -A 20 "endpoints:" | grep "GET" | head -1 | awk '{print $NF}')
if [ -n "$PUBLIC_ENDPOINT" ]; then
  PUBLIC_API_URL=$(echo "$PUBLIC_ENDPOINT" | sed 's|/health||' | sed 's|/themes.*||')
  echo "   Public API:  $PUBLIC_API_URL"
  echo "                └─ GET /health"
  echo "                └─ GET /themes"
  echo "                └─ GET /themes/{id}"
else
  echo "   Public API:  Run 'serverless info --stage $STAGE' to get URL"
fi
echo ""

# Admin API (only if deployed successfully)
if [ "$DEPLOY_ADMIN" = "yes" ]; then
  ADMIN_ENDPOINT=$(npx serverless info --stage $STAGE --config serverless-admin.yml 2>/dev/null | grep -A 20 "endpoints:" | grep "POST" | head -1 | awk '{print $NF}')
  if [ -n "$ADMIN_ENDPOINT" ]; then
    ADMIN_API_URL=$(echo "$ADMIN_ENDPOINT" | sed 's|/admin/.*||')
    echo "   Admin API:   $ADMIN_API_URL"
    echo "                └─ POST /admin/themes/generate"
    echo "                └─ PUT  /admin/themes/{id}/curate"
    echo "                └─ GET  /admin/themes"
  else
    echo "   Admin API:   Run 'serverless info --stage $STAGE --config serverless-admin.yml'"
  fi
  echo ""
fi

# CloudFront
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
  --stack-name memory-game-api-$STAGE \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text 2>/dev/null)

if [ -n "$CLOUDFRONT_URL" ] && [ "$CLOUDFRONT_URL" != "None" ]; then
  echo "   Frontend:    https://$CLOUDFRONT_URL"
else
  echo "   Frontend:    (CloudFront URL pending - check AWS Console)"
fi

echo ""
echo "================================"
echo ""
echo "📝 Next Steps:"
if [ "$STAGE" = "prod" ]; then
  echo "   1. Update CORS origin in serverless.yml (line 54)"
  echo "   2. Set up custom domain for CloudFront"
  echo "   3. Configure HTTPS certificate via ACM"
  echo "   4. Set up AWS billing alerts (\$50 monthly budget)"
  echo "   5. Test all public endpoints"
  echo "   6. Review SECURE_LAUNCH_PLAN.md for security checklist"
else
  echo "   1. Test the public API:"
  if [ -n "$PUBLIC_API_URL" ]; then
    echo "      curl $PUBLIC_API_URL/health"
  fi
  echo ""
  echo "   2. Visit frontend at CloudFront URL above"
  echo ""
  if [ "$DEPLOY_ADMIN" = "yes" ]; then
    echo "   3. Generate test themes via admin API"
    echo "      (see SECURE_LAUNCH_PLAN.md for curl examples)"
  fi
fi
echo ""