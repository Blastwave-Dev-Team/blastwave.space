#!/usr/bin/env bash
# Install nginx site config and obtain Let's Encrypt certificates.
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo $0"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

install -m 644 "${INFRA_DIR}/nginx/blastwave.conf" /etc/nginx/sites-available/blastwave
ln -sf /etc/nginx/sites-available/blastwave /etc/nginx/sites-enabled/blastwave
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

certbot --nginx \
  -d blastwave.space \
  -d www.blastwave.space \
  -d wiki.blastwave.space \
  -d book.blastwave.space \
  --non-interactive --agree-tos -m "${CERTBOT_EMAIL:?Set CERTBOT_EMAIL}"

systemctl reload nginx
echo "TLS configured for blastwave.space, wiki.blastwave.space, book.blastwave.space"
