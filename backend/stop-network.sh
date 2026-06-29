#!/bin/bash
#
# Complete network shutdown script
# Stops chaincode containers AND the Fabric network
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================="
echo "  Stopping Blockchain Charity Network"
echo "========================================="

# Step 1: Stop chaincode containers first
echo ""
echo "[1/5] Stopping chaincode containers..."
cd "$SCRIPT_DIR"

# Stop using docker-compose if file exists
if [ -f "fabric-samples/test-network/compose/compose-ccc01-ccaas.yaml" ]; then
    docker-compose -f fabric-samples/test-network/compose/compose-ccc01-ccaas.yaml down 2>/dev/null || true
fi

# Force stop and remove any remaining chaincode containers
docker stop peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas 2>/dev/null || true
docker rm peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas 2>/dev/null || true

echo "✓ Chaincode containers stopped"

# Step 2: Stop Explorer containers (best effort)
echo ""
echo "[2/5] Stopping Hyperledger Explorer containers..."
if [ -f "explorer/docker-compose.yaml" ]; then
    (cd explorer && docker compose --env-file .env -f docker-compose.yaml down 2>/dev/null) || true
    echo "✓ Explorer containers stopped"
else
    echo "! Explorer compose file not found, skipping"
fi

# Step 3: Stop the Fabric network
echo ""
echo "[3/5] Stopping Fabric network..."
cd "$SCRIPT_DIR/fabric-samples/test-network"
./network.sh down

echo ""
echo "[4/5] Removing Fabric ledger volumes..."
FABRIC_VOLUMES=$(docker volume ls -q | grep -E 'orderer\.example\.com|peer0\.org[123]\.example\.com' || true)
if [[ -n "$FABRIC_VOLUMES" ]]; then
    docker volume rm $FABRIC_VOLUMES 2>/dev/null || true
fi
echo "Fabric volumes removed"

# Step 4: Clear local node-sdk persisted state
echo ""
echo "[4/5] Clearing node-sdk persisted state..."
rm -f "$SCRIPT_DIR/node-sdk/data/approvals.json" "$SCRIPT_DIR/node-sdk/data/donor-kyc.json" "$SCRIPT_DIR/node-sdk/data/ngoRegistry.json" "$SCRIPT_DIR/node-sdk/data/govUsers.json" "$SCRIPT_DIR/node-sdk/data/auth.db" "$SCRIPT_DIR/node-sdk/data/sessions.sqlite" "$SCRIPT_DIR/node-sdk/data/sessions.sqlite-shm" "$SCRIPT_DIR/node-sdk/data/sessions.sqlite-wal" 2>/dev/null || true
rm -rf "$SCRIPT_DIR/node-sdk/data/approval-receipts" 2>/dev/null || true
rm -rf "$SCRIPT_DIR/node-sdk/data/donor-kyc-docs" 2>/dev/null || true
echo "Node SDK state cleared"

# Step 5: Clear local wallet certificates
echo ""
echo "[5/5] Clearing node-sdk wallet certificates..."
cd "$SCRIPT_DIR"
if [ -d "$SCRIPT_DIR/node-sdk/wallet" ]; then
    rm -f "$SCRIPT_DIR/node-sdk/wallet"/* 2>/dev/null || true
    echo "✓ Wallet certificates cleared"
else
    echo "! Wallet directory not found, skipping"
fi

echo ""
echo "========================================="
echo "  Network Stopped Successfully! ✓"
echo "========================================="
