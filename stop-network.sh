#!/bin/bash
#
# Complete network shutdown script
# Stops chaincode containers AND the Fabric network
#

echo "========================================="
echo "  Stopping Blockchain Charity Network"
echo "========================================="

# Step 1: Stop chaincode containers first
echo ""
echo "[1/2] Stopping chaincode containers..."
cd "$(dirname "$0")"

# Stop using docker-compose if file exists
if [ -f "fabric-samples/test-network/compose/compose-ccc01-ccaas.yaml" ]; then
    docker-compose -f fabric-samples/test-network/compose/compose-ccc01-ccaas.yaml down 2>/dev/null || true
fi

# Force stop and remove any remaining chaincode containers
docker stop peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas 2>/dev/null || true
docker rm peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas 2>/dev/null || true

echo "✓ Chaincode containers stopped"

# Step 2: Stop the Fabric network
echo ""
echo "[2/2] Stopping Fabric network..."
cd fabric-samples/test-network
./network.sh down

echo ""
echo "========================================="
echo "  Network Stopped Successfully! ✓"
echo "========================================="
