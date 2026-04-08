#!/bin/bash
set -e

# Configuration - update these with your NAS details
NAS_HOST="${NAS_HOST:-your-nas-ip}"
NAS_USER="${NAS_USER:-admin}"
NAS_PORT="${NAS_PORT:-22}"
NAS_PATH="${NAS_PATH:-/volume1/docker/token_net}"

echo "=== Token Net Deploy ==="
echo "Deploying to ${NAS_USER}@${NAS_HOST}:${NAS_PATH}"

# Sync files to NAS
echo "[1/3] Syncing files..."
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='data/*.db' --exclude='data/screenshots' \
  -e "ssh -p ${NAS_PORT}" \
  ./ "${NAS_USER}@${NAS_HOST}:${NAS_PATH}/"

# Build and start on NAS
echo "[2/3] Building Docker image on NAS..."
ssh -p "${NAS_PORT}" "${NAS_USER}@${NAS_HOST}" \
  "cd ${NAS_PATH} && docker compose up -d --build"

echo "[3/3] Done! Access at http://${NAS_HOST}:3099"
