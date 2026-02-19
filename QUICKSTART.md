# Blockchain Charity Donation Tracking System - Quick Start

## 🚀 One-Command Setup

### Complete Network Setup (Recommended for first time)
```bash
chmod +x setup-network.sh deploy-chaincode.sh stop-chaincode.sh
./setup-network.sh
```

This single command will:
- ✓ Start Hyperledger Fabric network with Org1 & Org2
- ✓ Add Org3 (NGO organization)
- ✓ Deploy ccc01 chaincode (all 3 contracts)
- ✓ Start chaincode containers
- ✓ Register admin certificates

---

## 📋 Individual Commands

### 1. Network Management

#### Start Network (2 orgs)
```bash
cd fabric-samples/test-network
./network.sh up createChannel -c mychannel -ca -s couchdb
```

#### Add Org3
```bash
cd fabric-samples/test-network/addOrg3
./addOrg3.sh up -ca -s couchdb
```

#### Stop Network

**Windows (PowerShell):**
```powershell
.\stop-network.ps1
```

**Linux/WSL:**
```bash
./stop-network.sh
```

### 2. Chaincode Management

#### Deploy Chaincode (Automated)
```bash
./deploy-chaincode.sh
```

#### Stop Chaincode Containers
```bash
./stop-chaincode.sh
```

#### Manual Deployment (if needed)
```bash
cd fabric-samples/test-network

# Build image
docker build -f ../asset-transfer-basic/chaincode-javascript/Dockerfile \
    -t ccc01_ccaas_image:latest \
    --build-arg CC_SERVER_PORT=9999 \
    ../asset-transfer-basic/chaincode-javascript/

# Deploy
./network.sh deployCCAAS -ccn ccc01 -ccv 1.0 -ccs 1 \
    -ccp ../asset-transfer-basic/chaincode-javascript/

# Start containers
docker-compose -f compose/compose-ccc01-ccaas.yaml up -d
```

### 3. Upgrade Chaincode

```bash
# Update version and sequence
cd fabric-samples/test-network
docker build -f ../asset-transfer-basic/chaincode-javascript/Dockerfile \
    -t ccc01_ccaas_image:latest \
    --build-arg CC_SERVER_PORT=9999 \
    ../asset-transfer-basic/chaincode-javascript/

./network.sh deployCCAAS -ccn ccc01 -ccv 2.0 -ccs 2 \
    -ccp ../asset-transfer-basic/chaincode-javascript/

# Restart containers
docker-compose -f compose/compose-ccc01-ccaas.yaml restart
```

---

## 🔐 Admin Certificate Setup

### Register Organization Admins

```bash
cd node-sdk

# Org2 Admin (Government)
node registerGovAdmin.js
node registerGOVAdminUser.js

# Org3 Admin (NGO)
node registerNGOAdmin.js
node registerNGOAdminUser.js
```

---

## 🎯 Start Application

```bash
cd node-sdk
npm install   # First time only
npm run dev   # Start server on port 5000
```

---

## 🧪 Test API

### Register a Donor
```bash
curl -X POST http://localhost:5000/api/users/donor \
  -H "Content-Type: application/json" \
  -d '{
    "userCert": "govUserTom",
    "donorId": "donor001",
    "name": "John Doe",
    "email": "john@example.com",
    "alias": "JohnD"
  }'
```

---

## 🔍 Verify Status

### Check Network Containers
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Check Chaincode Containers
```bash
docker ps --filter name=ccc01
```

### View Chaincode Logs
```bash
docker logs peer0org1_ccc01_ccaas
docker logs peer0org2_ccc01_ccaas
docker logs peer0org3_ccc01_ccaas
```

---

## 🛠️ Troubleshooting

### If chaincode containers crash:
```bash
# Check logs
docker logs peer0org1_ccc01_ccaas

# Rebuild and restart
./deploy-chaincode.sh
```

### If "access denied" error:
```bash
cd node-sdk
# Re-register users with correct affiliation
rm wallet/govUserTom.id
node registerGovAdmin.js
node registerGOVAdminUser.js
```

### Clean restart:

**Windows (PowerShell):**
```powershell
.\stop-network.ps1
docker system prune -f
.\setup-network.ps1
```

**Linux/WSL:**
```bash
./stop-network.sh
docker system prune -f
./setup-network.sh
```

---

## 📦 What's Fixed

The following issues are now permanently resolved:

✅ **CommonJS Modules** - All contracts use `require/module.exports`
✅ **Correct Dockerfile CMD** - Uses `fabric-chaincode-node server` mode
✅ **User Affiliations** - Org2 users use `org2.department1`
✅ **Auto-restart** - Chaincode containers restart automatically
✅ **Docker Compose** - Streamlined container management

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Organizations                        │
├─────────────────────────────────────────────────────┤
│ Org1MSP (Platform)  → peer0.org1.example.com:7051  │
│ Org2MSP (Government)→ peer0.org2.example.com:9051  │
│ Org3MSP (NGO)       → peer0.org3.example.com:11051 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Chaincode (ccc01 v1.0)                 │
├─────────────────────────────────────────────────────┤
│ • UserContract    → NGO, Donor, Bank registration  │
│ • FundContract    → Fund creation, donations        │
│ • TokenContract   → Token issuance, transfer        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                Node.js API (Port 5000)              │
├─────────────────────────────────────────────────────┤
│ /api/users/*  → User management                     │
│ /api/funds/*  → Fund operations                     │
│ /api/tokens/* → Token management                    │
└─────────────────────────────────────────────────────┘
```

---

## 📝 Scripts Summary

| Script | Purpose |
|--------|---------|
| `setup-network.sh` | Complete network setup (all-in-one) |
| `deploy-chaincode.sh` | Build and deploy chaincode only |
| `stop-chaincode.sh` | Stop chaincode containers |
| `fabric-samples/test-network/network.sh` | Core network commands |
| `fabric-samples/test-network/addOrg3/addOrg3.sh` | Add Org3 |

---

## 🎓 Usage Examples

Full usage examples and API documentation are in the main [config.txt](config.txt) file.
