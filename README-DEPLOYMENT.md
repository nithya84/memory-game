# Memory Game Deployment Guide

> **📖 For detailed secure launch strategy, see [SECURE_LAUNCH_PLAN.md](./SECURE_LAUNCH_PLAN.md)**

## ⚠️ Security First

This project includes **admin endpoints** that trigger expensive AI generation via Amazon Bedrock.
**Production deployments should disable admin endpoints** to prevent unauthorized costs.

**Security measures in place:**
- Rate limiting on all endpoints (50 req/sec global, 1 req/sec for admin)
- Stage-specific CORS configuration
- Bearer token authentication for admin endpoints
- Throttling on expensive operations

## Prerequisites

1. **AWS CLI** installed and configured:
   ```bash
   # Install AWS CLI (already done)
   aws --version

   # Configure AWS credentials
   aws configure
   # Enter your:
   # - AWS Access Key ID
   # - AWS Secret Access Key
   # - Default region: us-east-1
   # - Default output format: json
   ```

2. **Environment Variables**:
   ```bash
   # For production deployment
   export JWT_SECRET_PROD="your-secure-jwt-secret-here"
   export ADMIN_TOKEN_DEV="your-dev-admin-token"
   export ADMIN_TOKEN_PROD="your-prod-admin-token"  # if keeping admin in prod
   ```

3. **AWS Permissions** - Your AWS user needs:
   - Lambda, API Gateway, DynamoDB, S3, IAM permissions
   - Bedrock access for AI image generation
   - CloudFront permissions for secure content delivery
   - For detailed permission requirements, see AWS Permissions section below

## Deployment Commands

### Development Deployment
```bash
./deploy.sh dev
```

### Production Deployment  
```bash
export JWT_SECRET_PROD="your-production-jwt-secret"
./deploy.sh prod
```

## What Gets Deployed

### Backend (AWS Lambda + API Gateway):
- **5 Lambda functions** (health, auth, themes)
- **API Gateway** REST API with CORS
- **DynamoDB tables** (users, themes, games, sessions)
- **S3 bucket** for AI-generated images (private)
- **CloudFront distribution** with Origin Access Control
- **IAM roles** with proper permissions

### Frontend (CloudFront + S3):
- **React app** built with Vite
- **S3 bucket** (private, served via CloudFront)
- **CloudFront distribution** with HTTPS and caching
- **Secure access** via Origin Access Control

## Post-Deployment

1. **Update frontend API URLs**:
   - Copy API Gateway URL from deployment output
   - Update respective environment file:
     - `frontend/.env.dev` for dev
     - `frontend/.env.production` for prod

2. **Test the deployment**:
   - Visit frontend URL
   - Try creating a theme (if using real AI)
   - Check DynamoDB tables in AWS console

## Environments

- **Local**: Mock AI, no AWS costs
- **Dev**: Real AI on AWS, ~$1-5/month
- **Prod**: Real AI on AWS, set `JWT_SECRET_PROD`

## Costs

- **Dev**: ~$5/month
- **Prod**: ~$20/month (depends on usage)

## Monitoring

- **CloudWatch Logs**: Lambda function logs
- **DynamoDB Metrics**: Read/write capacity usage
- **S3 Access Logs**: Frontend and image access patterns

## AWS Permissions Required

### Quick Setup (Recommended)
Attach the `AdministratorAccess` managed policy to your AWS user for full permissions.

### Detailed Permissions (Production)
If you need granular permissions, your AWS user requires:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "lambda:*",
                "apigateway:*",
                "dynamodb:*",
                "s3:*",
                "logs:*",
                "iam:GetRole",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:PassRole",
                "iam:TagRole",
                "iam:UntagRole",
                "iam:ListRoleTags",
                "bedrock:InvokeModel",
                "cloudfront:CreateDistribution",
                "cloudfront:GetDistribution",
                "cloudfront:GetDistributionConfig",
                "cloudfront:UpdateDistribution",
                "cloudfront:DeleteDistribution",
                "cloudfront:ListDistributions",
                "cloudfront:CreateOriginAccessControl",
                "cloudfront:GetOriginAccessControl",
                "cloudfront:UpdateOriginAccessControl",
                "cloudfront:DeleteOriginAccessControl",
                "cloudfront:ListOriginAccessControls",
                "cloudfront:TagResource",
                "cloudfront:UntagResource",
                "cloudfront:ListTagsForResource"
            ],
            "Resource": "*"
        }
    ]
}
```

### Common Permission Issues
- **Tagging Permissions**: AWS now requires explicit tagging permissions (`logs:TagResource`, `iam:TagRole`)
- **Bedrock Access**: Requires `bedrock:InvokeModel` for AI image generation
- **CloudFront Access**: Requires CloudFront permissions for CDN image serving and Origin Access Control (OAC)