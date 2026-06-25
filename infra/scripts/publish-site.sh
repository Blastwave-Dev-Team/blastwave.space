#!/usr/bin/env bash
# Build and publish the marketing site to nginx on the droplet.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${REPO_ROOT}"
npm ci
npm run build
rsync -av --delete dist/ /var/www/blastwave/
echo "Published blastwave-website to /var/www/blastwave"
