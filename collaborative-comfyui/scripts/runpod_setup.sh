#!/bin/bash
# RunPod setup script for Collaborative ComfyUI

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Collaborative ComfyUI RunPod Setup ===${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
apt-get update
apt-get install -y git docker.io docker-compose curl nginx

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Install NVIDIA Container Toolkit
echo -e "${YELLOW}Installing NVIDIA Container Toolkit...${NC}"
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | tee /etc/apt/sources.list.d/nvidia-docker.list
apt-get update
apt-get install -y nvidia-container-toolkit
systemctl restart docker

# Clone repository
echo -e "${YELLOW}Cloning repository...${NC}"
cd /opt
git clone https://github.com/yourusername/collaborative-comfyui.git
cd collaborative-comfyui

# Create necessary directories
mkdir -p comfyui_workflows comfyui_output comfyui_custom_nodes comfyui_models nginx/ssl static

# Generate self-signed SSL certificate
echo -e "${YELLOW}Generating SSL certificate...${NC}"
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Set environment variables
echo -e "${YELLOW}Setting up environment variables...${NC}"
cat > .env << EOL
DB_PASSWORD=$(openssl rand -base64 12)
SECRET_KEY=$(openssl rand -base64 32)
EOL

# Start the application
echo -e "${YELLOW}Starting the application...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Initialize the database
echo -e "${YELLOW}Initializing the database...${NC}"
docker-compose -f docker-compose.prod.yml exec backend python scripts/init_db.py

echo -e "${GREEN}=== Setup Complete ===${NC}"
echo -e "${GREEN}Your Collaborative ComfyUI platform is now running!${NC}"
echo -e "${GREEN}You can access it at https://$(curl -s ifconfig.me)${NC}"
echo -e "${YELLOW}Default admin credentials:${NC}"
echo -e "${YELLOW}Username: admin${NC}"
echo -e "${YELLOW}Password: admin${NC}"
echo -e "${RED}IMPORTANT: Please change the default admin password immediately!${NC}"
