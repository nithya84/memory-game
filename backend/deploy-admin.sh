#!/bin/bash
# Deploy admin API to AWS

set -e

# Load non-AWS variables from parent .env (ADMIN_TOKEN, etc)
if [ -f "../.env" ]; then
    while IFS= read -r line; do
        [[ $line =~ ^#.*$ ]] && continue
        [[ -z $line ]] && continue
        # Skip AWS credentials - use bash env instead
        [[ $line == AWS_* ]] && continue
        # Split on first = only to preserve = in values
        key="${line%%=*}"
        value="${line#*=}"
        [[ -n $key ]] && export "$key=$value"
    done < "../.env"
fi

# Override for production deployment
export USE_MOCK_AI=false
export CLOUDFRONT_DOMAIN="d19me0v65pp4hx.cloudfront.net"

# Deploy (uses AWS credentials from bash environment)
npm run deploy:admin -- --stage "${1:-dev}"
