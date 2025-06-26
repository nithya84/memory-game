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

echo "4. Installing frontend dependencies..."
cd ../frontend
npm install

echo "5. Building frontend..."
npm run build

echo "6. Deploying frontend to S3..."
# Get the S3 bucket name from serverless output
BUCKET_NAME="memory-game-frontend-$STAGE"

# Create S3 bucket for frontend if it doesn't exist
aws s3 mb s3://$BUCKET_NAME --region us-east-2 2>/dev/null || true

# Configure bucket for static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Upload frontend files
aws s3 sync dist/ s3://$BUCKET_NAME --delete

# Make bucket publicly readable
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow", 
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }
  ]
}'

echo "Deployment complete!"
echo "Backend API: https://$(cd ../backend && serverless info --stage $STAGE | grep ServiceEndpoint | cut -d' ' -f2)"
echo "Frontend URL: http://$BUCKET_NAME.s3-website.us-east-2.amazonaws.com"
echo ""
echo "Next steps:"
echo "1. Set up custom domain with CloudFront for production"
echo "2. Configure HTTPS certificates"
echo "3. Set up monitoring and logging"