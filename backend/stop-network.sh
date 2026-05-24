#!/bin/bash
#
# Complete network shutdown script
# Stops chaincode containers AND the Fabric network
#

FRESH_START=0
if [[ "${1:-}" == "--fresh-start" ]]; then
    FRESH_START=1
fi

echo "========================================="
echo "  Stopping Blockchain Charity Network"
echo "========================================="

# Step 1: Stop chaincode containers first
echo ""
echo "[1/5] Stopping chaincode containers..."
cd "$(dirname "$0")"

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
cd fabric-samples/test-network
./network.sh down

if [[ "$FRESH_START" -eq 1 ]]; then
    echo ""
    echo "[4/5] Removing Fabric ledger volumes..."
    docker volume rm orderer.example.com peer0.org1.example.com peer0.org2.example.com peer0.org3.example.com 2>/dev/null || true
    echo "Fabric volumes removed"
fi

# Step 4: Clear local node-sdk persisted state
echo ""
echo "[4/5] Clearing node-sdk persisted state..."
rm -f node-sdk/data/approvals.json node-sdk/data/ngoRegistry.json node-sdk/data/govUsers.json node-sdk/data/auth.db node-sdk/data/sessions.sqlite node-sdk/data/sessions.sqlite-shm node-sdk/data/sessions.sqlite-wal 2>/dev/null || true
rm -rf node-sdk/data/approval-receipts 2>/dev/null || true
echo "Node SDK state cleared"

# Step 5: Clear local wallet certificates
echo ""
echo "[5/5] Clearing node-sdk wallet certificates..."
cd ../..
if [ -d "node-sdk/wallet" ]; then
    rm -f node-sdk/wallet/* 2>/dev/null || true
    echo "✓ Wallet certificates cleared"
else
    echo "! Wallet directory not found, skipping"
fi

echo ""
echo "========================================="
echo "  Network Stopped Successfully! ✓"
echo "========================================="
