#!/bin/bash

# Memory Game Deployment Script
set -e

STAGE=${1:-dev}
echo "Deploying Memory Game to stage: $STAGE"

# Check required environment variables for production
if [ "$STAGE" = "prod" ]; then
  if [ -z "$JWT_SECRET_PROD" ]; then
    echo "Error: JWT_SECRET_PROD environment variable required for production deployment"
    exit 1
  fi
fi

echo "1. Installing backend dependencies..."
cd backend
npm install

echo "2. Building backend..."
npm run build

echo "3. Deploying backend infrastructure and Lambda functions..."
npm run deploy -- --stage $STAGE

echo "4. Cleaning and installing frontend dependencies..."
cd ../frontend
npm run clean
npm install

echo "5. Building frontend..."
if [ "$STAGE" = "prod" ]; then
  npm run build
else
  npm run build -- --mode $STAGE
fi

echo "6. Deploying frontend to S3..."
# Get the S3 bucket name from serverless output
BUCKET_NAME="memory-game-frontend-$STAGE"

# Create S3 bucket for frontend if it doesn't exist
aws s3 mb s3://$BUCKET_NAME --region us-east-1 2>/dev/null || true

# Upload frontend files (private bucket - will be served via CloudFront)
aws s3 sync dist/ s3://$BUCKET_NAME --delete

echo "Frontend uploaded to private S3 bucket: $BUCKET_NAME"
echo "Frontend will be accessible via CloudFront distribution (check backend deployment output)"

echo "Deployment complete!"
echo "Backend API: https://$(cd ../backend && npx serverless info --stage $STAGE | grep ServiceEndpoint | cut -d' ' -f2)"
echo "Frontend URL: https://$(cd ../backend && aws cloudformation describe-stacks --stack-name memory-game-api-$STAGE --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' --output text 2>/dev/null || echo 'CloudFront URL not found')"
echo ""
echo "Next steps:"
echo "1. Set up custom domain with CloudFront for production"
echo "2. Configure HTTPS certificates"
echo "3. Set up monitoring and logging"