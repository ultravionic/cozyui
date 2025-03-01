#!/bin/bash
# Cloudflare Pages deployment script for Collaborative ComfyUI frontend

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Collaborative ComfyUI Cloudflare Deployment ===${NC}"

# Check if API_URL is provided
if [ -z "$1" ]; then
  echo -e "${RED}Please provide your backend API URL as the first argument${NC}"
  echo -e "${YELLOW}Example: ./cloudflare_deploy.sh https://api.yourdomain.com${NC}"
  exit 1
fi

API_URL=$1

# Check if Cloudflare API token is provided
if [ -z "$2" ]; then
  echo -e "${RED}Please provide your Cloudflare API token as the second argument${NC}"
  echo -e "${YELLOW}Example: ./cloudflare_deploy.sh https://api.yourdomain.com your-api-token${NC}"
  exit 1
fi

CF_API_TOKEN=$2

# Check if project name is provided
if [ -z "$3" ]; then
  PROJECT_NAME="collaborative-comfyui"
  echo -e "${YELLOW}Using default project name: ${PROJECT_NAME}${NC}"
else
  PROJECT_NAME=$3
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo -e "${YELLOW}Installing wrangler CLI...${NC}"
  npm install -g wrangler
fi

# Navigate to frontend directory
cd ../frontend

# Create .env file with API URL
echo -e "${YELLOW}Creating .env file with API URL...${NC}"
cat > .env << EOL
REACT_APP_API_URL=${API_URL}
REACT_APP_SOCKET_URL=${API_URL}
EOL

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Build the project
echo -e "${YELLOW}Building the project...${NC}"
npm run build

# Create wrangler.toml
echo -e "${YELLOW}Creating wrangler.toml...${NC}"
cat > wrangler.toml << EOL
name = "${PROJECT_NAME}"
type = "webpack"
account_id = ""
workers_dev = true
route = ""
zone_id = ""

[site]
bucket = "./build"
entry-point = "workers-site"
EOL

# Deploy to Cloudflare Pages
echo -e "${YELLOW}Deploying to Cloudflare Pages...${NC}"
CF_API_TOKEN=${CF_API_TOKEN} wrangler pages publish build --project-name=${PROJECT_NAME}

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "${GREEN}Your Collaborative ComfyUI frontend is now deployed on Cloudflare Pages!${NC}"
echo -e "${GREEN}You can access it at https://${PROJECT_NAME}.pages.dev${NC}"
