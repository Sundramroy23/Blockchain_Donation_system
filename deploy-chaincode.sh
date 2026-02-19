#!/bin/bash
#
# Automated Chaincode Deployment Script for ccc01
# Deploys charity donation tracking chaincode with CCAAS mode
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
CHAINCODE_NAME="ccc01"
CHAINCODE_VERSION="1.0"
CHAINCODE_SEQUENCE="1"
CHAINCODE_PATH="../asset-transfer-basic/chaincode-javascript"
CHANNEL_NAME="mychannel"
COMPOSE_FILE="./compose/compose-ccc01-ccaas.yaml"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Charity Donation Chaincode Deploy${NC}"
echo -e "${GREEN}========================================${NC}"

cd fabric-samples/test-network || exit 1

# Cleanup: Stop and remove old chaincode containers if they exist
echo -e "\n${YELLOW}Cleaning up old chaincode containers...${NC}"
docker stop peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas 2>/dev/null || true
docker rm peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Step 1: Build the chaincode Docker image (only if it doesn't exist)
echo -e "\n${YELLOW}[1/3] Checking chaincode Docker image...${NC}"
if docker images -q ${CHAINCODE_NAME}_ccaas_image:latest | grep -q .; then
    echo -e "${GREEN}✓ Chaincode image already exists, skipping build${NC}"
else
    echo "Building chaincode Docker image..."
    docker build -f ${CHAINCODE_PATH}/Dockerfile \
        -t ${CHAINCODE_NAME}_ccaas_image:latest \
        --build-arg CC_SERVER_PORT=9999 \
        ${CHAINCODE_PATH}

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Chaincode image built successfully${NC}"
    else
        echo -e "${RED}✗ Failed to build chaincode image${NC}"
        exit 1
    fi
fi

# Step 2: Deploy chaincode using deployCCAAS
echo -e "\n${YELLOW}[2/3] Deploying chaincode to network...${NC}"
./network.sh deployCCAAS \
    -ccn ${CHAINCODE_NAME} \
    -ccv ${CHAINCODE_VERSION} \
    -ccs ${CHAINCODE_SEQUENCE} \
    -ccp ${CHAINCODE_PATH}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Chaincode deployed successfully${NC}"
else
    echo -e "${RED}✗ Failed to deploy chaincode${NC}"
    exit 1
fi

# Step 3: Verify chaincode containers are running
echo -e "\n${YELLOW}[3/3] Verifying chaincode containers...${NC}"
sleep 3
RUNNING_COUNT=$(docker ps --filter "name=${CHAINCODE_NAME}" --format "{{.Names}}" | wc -l)

if [ $RUNNING_COUNT -eq 3 ]; then
    echo -e "${GREEN}✓ All 3 chaincode containers are running${NC}"
else
    echo -e "${YELLOW}⚠ Found $RUNNING_COUNT containers, expected 3${NC}"
    echo -e "${YELLOW}Note: network.sh deployCCAAS already started the containers${NC}"
fi

# Verify containers are running
echo -e "\n${YELLOW}Verifying chaincode containers...${NC}"
sleep 3
RUNNING=$(docker ps --filter name=${CHAINCODE_NAME} --format "{{.Names}}" | wc -l)

if [ "$RUNNING" -eq 3 ]; then
    echo -e "${GREEN}✓ All 3 chaincode containers are running${NC}"
    docker ps --filter name=${CHAINCODE_NAME} --format "table {{.Names}}\t{{.Status}}"
else
    echo -e "${RED}✗ Expected 3 containers, found $RUNNING${NC}"
    exit 1
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   Deployment Complete! ✓${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Chaincode: ${CHAINCODE_NAME}"
echo -e "Version: ${CHAINCODE_VERSION}"
echo -e "Channel: ${CHANNEL_NAME}"
echo -e "\nYou can now test the chaincode with your Node.js application."
