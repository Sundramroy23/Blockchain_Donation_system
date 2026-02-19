#!/bin/bash
#
# Complete Network Setup Script
# Brings up the Hyperledger Fabric network, adds Org3, and deploys chaincode
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Blockchain Charity Network Setup${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if network is already running
if docker ps | grep -q "peer0.org1.example.com"; then
    echo -e "${YELLOW}Network is already running. Cleaning up first...${NC}"
    cd fabric-samples/test-network
    ./network.sh down
    cd ../..
fi

# Step 1: Bring up the network with 2 orgs
echo -e "\n${GREEN}[1/4] Starting network with Org1 and Org2...${NC}"
cd fabric-samples/test-network
./network.sh up createChannel -c mychannel -ca -s couchdb

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Network up with 2 organizations${NC}"
else
    echo -e "${RED}✗ Failed to start network${NC}"
    exit 1
fi

# Step 2: Add Org3 to the network
echo -e "\n${GREEN}[2/4] Adding Org3 to the network...${NC}"
cd addOrg3
./addOrg3.sh up -ca -s couchdb

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Org3 added successfully${NC}"
else
    echo -e "${RED}✗ Failed to add Org3${NC}"
    exit 1
fi

cd ..

# Step 3: Deploy chaincode
echo -e "\n${GREEN}[3/4] Deploying chaincode...${NC}"
cd ../..
./deploy-chaincode.sh

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Chaincode deployed successfully${NC}"
else
    echo -e "${RED}✗ Failed to deploy chaincode${NC}"
    exit 1
fi

# Step 4: Setup admin certificates
echo -e "\n${GREEN}[4/4] Setting up admin certificates...${NC}"
cd node-sdk

# Register Org2 Admin (Government)
if [ ! -f wallet/govAdmin.id ]; then
    echo "Registering govAdmin..."
    node registerGovAdmin.js
fi

# Register Org3 Admin (NGO)
if [ ! -f wallet/ngoAdmin.id ]; then
    echo "Registering ngoAdmin..."
    node registerNGOAdmin.js
fi

# Register sample users
if [ ! -f wallet/govUserTom.id ]; then
    echo "Registering govUserTom..."
    node registerGOVAdminUser.js
fi

if [ ! -f wallet/ngoAdminUser.id ]; then
    echo "Registering ngoAdminUser..."
    node registerNGOAdminUser.js
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}   Setup Complete! ✓${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Network Status:${NC}"
echo -e "  • Org1MSP (Platform) - peer0.org1.example.com"
echo -e "  • Org2MSP (Government) - peer0.org2.example.com"
echo -e "  • Org3MSP (NGO) - peer0.org3.example.com"
echo -e "  • Channel: mychannel"
echo -e "  • Chaincode: ccc01 v1.0"
echo -e "\n${GREEN}Registered Users:${NC}"
echo -e "  • govAdmin (Org2)"
echo -e "  • govUserTom (Org2)"
echo -e "  • ngoAdmin (Org3)"
echo -e "  • ngoAdminUser (Org3)"
echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "  1. Start Node.js API: cd node-sdk && npm run dev"
echo -e "  2. Test API: http://localhost:5000"
echo -e "\nTo stop the network: cd fabric-samples/test-network && ./network.sh down"
