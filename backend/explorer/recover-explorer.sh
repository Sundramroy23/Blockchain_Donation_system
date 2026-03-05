#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_PATH="$SCRIPT_DIR/connection-profile/test-network.template.json"
OUTPUT_PATH="$SCRIPT_DIR/connection-profile/test-network.json"
ENV_EXAMPLE_PATH="$SCRIPT_DIR/.env.example"
ENV_PATH="$SCRIPT_DIR/.env"

ORG1_KEY_DIR="$SCRIPT_DIR/../fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore"

if ! docker network ls --format '{{.Name}}' | grep -q '^fabric_test$'; then
  echo "[Explorer] Docker network 'fabric_test' not found. Start Fabric first." >&2
  exit 1
fi

if [ ! -d "$ORG1_KEY_DIR" ]; then
  echo "[Explorer] Org1 keystore directory not found: $ORG1_KEY_DIR" >&2
  exit 1
fi

ORG1_KEY_FILE="$(find "$ORG1_KEY_DIR" -maxdepth 1 -type f | head -n 1)"
if [ -z "$ORG1_KEY_FILE" ]; then
  echo "[Explorer] No private key file found in: $ORG1_KEY_DIR" >&2
  exit 1
fi

ORG1_KEY_BASENAME="$(basename "$ORG1_KEY_FILE")"

if [ ! -f "$TEMPLATE_PATH" ]; then
  echo "[Explorer] Missing template: $TEMPLATE_PATH" >&2
  exit 1
fi

sed "s/__ORG1_ADMIN_KEY_FILE__/$ORG1_KEY_BASENAME/g" "$TEMPLATE_PATH" > "$OUTPUT_PATH"

if [ ! -f "$ENV_PATH" ] && [ -f "$ENV_EXAMPLE_PATH" ]; then
  cp "$ENV_EXAMPLE_PATH" "$ENV_PATH"
fi

pushd "$SCRIPT_DIR" >/dev/null
docker compose --env-file .env -f docker-compose.yaml down -v
docker compose --env-file .env -f docker-compose.yaml up -d --force-recreate
popd >/dev/null

echo "[Explorer] Recovery complete. URL: http://localhost:8081"
