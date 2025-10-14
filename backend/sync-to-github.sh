#!/bin/bash
# ===========================================
# OBS REMOTE MEDIA BACKEND - GITHUB SYNC
# ===========================================
# Sync your backend server to GitHub

set -e  # Exit on any error

echo "🔄 Syncing OBS Remote Media Backend to GitHub..."

# Configuration
REPO_URL="https://github.com/piosteiner/obs-remote-media-controller.git"
TEMP_DIR="/tmp/obs-remote-sync"
SOURCE_DIR="/var/www/obs-remote-media-backend"
COMMIT_MSG="${1:-Update backend code}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📁 Setting up sync workspace...${NC}"

# Clean up and prepare
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

echo -e "${BLUE}📥 Cloning GitHub repository...${NC}"
git clone "$REPO_URL" .

echo -e "${BLUE}� Syncing backend files...${NC}"

# Create backend directory structure
mkdir -p backend/{src/{routes,services,middleware},uploads,logs}

# Copy all backend files (excluding node_modules, logs, uploads content, .env)
echo -e "${YELLOW}📋 Copying backend files...${NC}"

# Core files
cp "$SOURCE_DIR/package.json" backend/
cp "$SOURCE_DIR/.gitignore" backend/
cp "$SOURCE_DIR/ecosystem.config.js" backend/
cp "$SOURCE_DIR/sync-to-github.sh" backend/

# Documentation
if [ -f "$SOURCE_DIR/README.md" ]; then
    cp "$SOURCE_DIR/README.md" backend/
fi
if [ -f "$SOURCE_DIR/DEPLOYMENT_STATUS.md" ]; then
    cp "$SOURCE_DIR/DEPLOYMENT_STATUS.md" backend/
fi
if [ -f "$SOURCE_DIR/QUICK_START.md" ]; then
    cp "$SOURCE_DIR/QUICK_START.md" backend/
fi

# Source code
cp -r "$SOURCE_DIR/src/"* backend/src/

# .env.example (not the real .env)
if [ -f "$SOURCE_DIR/.env" ]; then
    # Create .env.example from .env with placeholder values
    sed 's/=.*/=/' "$SOURCE_DIR/.env" > backend/.env.example
    echo -e "${YELLOW}ℹ️  Created .env.example (secrets not included)${NC}"
fi

# Keep empty directories
touch backend/uploads/.gitkeep
touch backend/logs/.gitkeep

echo -e "${BLUE}📝 Committing changes...${NC}"

# Configure git if needed
git config user.email "piosteiner@gmail.com" 2>/dev/null || true
git config user.name "Pio Steiner" 2>/dev/null || true

# Check if there are changes
if git diff --quiet backend/ 2>/dev/null && git diff --cached --quiet backend/ 2>/dev/null; then
    echo -e "${YELLOW}ℹ️  No changes to sync${NC}"
else
    git add backend/
    git commit -m "$COMMIT_MSG"
    
    echo -e "${BLUE}🚀 Pushing to GitHub...${NC}"
    git push origin main 2>/dev/null || git push origin master
    
    echo -e "${GREEN}✅ Backend synced to GitHub!${NC}"
fi

# Cleanup
cd /
rm -rf "$TEMP_DIR"

echo -e "${GREEN}🎉 Sync complete!${NC}"
echo -e "${BLUE}🔗 View at: https://github.com/piosteiner/obs-remote-media-controller/tree/main/backend${NC}"
