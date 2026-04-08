#!/bin/sh
set -e

echo "[TokenNet] Starting application..."

# Ensure data directory exists
mkdir -p /app/data/screenshots

# Start Next.js server
echo "[TokenNet] Starting Next.js server on port 3000..."
exec node server.js
