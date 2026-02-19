#!/bin/bash
#
# Stop and clean up chaincode containers
#

set -e

CHAINCODE_NAME="ccc01"
COMPOSE_FILE="./fabric-samples/test-network/compose/compose-ccc01-ccaas.yaml"

echo "Stopping chaincode containers..."
docker-compose -f ${COMPOSE_FILE} down 2>/dev/null || true

# Force stop and remove if docker-compose fails
docker stop peer0org1_${CHAINCODE_NAME}_ccaas peer0org2_${CHAINCODE_NAME}_ccaas peer0org3_${CHAINCODE_NAME}_ccaas 2>/dev/null || true
docker rm peer0org1_${CHAINCODE_NAME}_ccaas peer0org2_${CHAINCODE_NAME}_ccaas peer0org3_${CHAINCODE_NAME}_ccaas 2>/dev/null || true

echo "✓ Chaincode containers cleaned up"
