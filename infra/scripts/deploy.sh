#!/usr/bin/env bash
# Deploy Wiki.js + book-proxy from repo checkout on the droplet.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${INFRA_DIR}/.." && pwd)"

cd "${INFRA_DIR}"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created infra/.env — set DB_PASSWORD and WIKIJS_API_KEY before continuing."
  exit 1
fi

docker compose build book-proxy
docker compose up -d

echo "Services started. Configure nginx (infra/nginx/blastwave.conf) and DNS, then run setup-ssl.sh."
