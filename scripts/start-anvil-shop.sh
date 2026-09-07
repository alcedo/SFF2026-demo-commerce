#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
set -a
# shellcheck disable=SC1091
source "$root/config/test-wallets.env"
# shellcheck disable=SC1091
source "$root/config/anvil.env"
set +a
cd "$root"
mkdir -p data
rm -f data/vouchershop.json
exec npx next dev --hostname 127.0.0.1 --port "${PORT:-4010}"
