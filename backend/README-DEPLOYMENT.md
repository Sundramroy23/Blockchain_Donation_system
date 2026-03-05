# README: Automated Chaincode Deployment

## ✅ What's Fixed

All chaincode deployment issues are now **permanently resolved**:

### 1. **CommonJS Module System**
   - ✓ All contracts converted from ES6 `import/export` to CommonJS `require/module.exports`
   - ✓ Files fixed: `userContract.js`, `fundContract.js`, `tokenContract.js`, `utils.js`

### 2. **Correct Dockerfile Configuration**
   - ✓ Uses `fabric-chaincode-node server` mode for CCAAS
   - ✓ Proper environment variable handling
   - ✓ Chaincode listens for peer connections instead of connecting

### 3. **Docker Compose Integration**
   - ✓ `compose-ccc01-ccaas.yaml` manages all 3 chaincode containers
   - ✓ Auto-restart on failure
   - ✓ Proper network configuration

### 4. **User Affiliation Fix**
   - ✓ Org2 users use correct `org2.department1` affiliation
   - ✓ Org3 users use correct `org3.department1` affiliation

---

## 🚀 Quick Start (Windows)

### One-Command Setup
```powershell
.\setup-network.ps1
```

### Deploy Chaincode Only
```powershell
.\deploy-chaincode.ps1
```

### Stop Chaincode
```powershell
docker-compose -f fabric-samples/test-network/compose/compose-ccc01-ccaas.yaml down
```

---

## 🐧 Quick Start (Linux/Mac)

### One-Command Setup
```bash
chmod +x setup-network.sh deploy-chaincode.sh stop-chaincode.sh
./setup-network.sh
```

### Deploy Chaincode Only
```bash
./deploy-chaincode.sh
```

### Stop Chaincode
```bash
./stop-chaincode.sh
```

---

## 📁 File Structure

```
blockchain/
├── setup-network.sh/ps1      # Complete network setup
├── deploy-chaincode.sh/ps1   # Chaincode deployment only
├── stop-chaincode.sh          # Stop chaincode containers
├── QUICKSTART.md             # Detailed documentation
├── config.txt                # Updated configuration guide
└── fabric-samples/
    └── test-network/
        └── compose/
            └── compose-ccc01-ccaas.yaml  # Chaincode container config
```

---

## 🔄 Workflow

### First Time Setup
1. Run `setup-network.ps1` (Windows) or `setup-network.sh` (Linux)
2. Wait for completion (~5-10 minutes)
3. Start API: `cd node-sdk && npm run dev`

### Daily Development
1. Network already up? Just run `deploy-chaincode.ps1` if you modified contracts
2. Restart API: `cd node-sdk && npm run dev`

### Clean Restart
```powershell
.\stop-network.ps1
.\setup-network.ps1
```

---

## 🧪 Testing

### Verify Chaincode Containers
```powershell
docker ps --filter name=ccc01
```

Expected output:
```
peer0org1_ccc01_ccaas   Up   ccc01_ccaas_image:latest
peer0org2_ccc01_ccaas   Up   ccc01_ccaas_image:latest
peer0org3_ccc01_ccaas   Up   ccc01_ccaas_image:latest
```

### Check Chaincode Logs
```powershell
docker logs peer0org1_ccc01_ccaas
```

Should show:
```
Bootstrap process completed
Creating new Chaincode Support Client
Registering with peer
```

### Test API
```powershell
# Register a donor
curl -X POST http://localhost:5000/api/users/donor `
  -H "Content-Type: application/json" `
  -d '{
    "userCert": "govUserTom",
    "donorId": "donor001",
    "name": "Test User",
    "email": "test@example.com",
    "alias": "TestUser"
  }'
```

---

## 🛠️ Troubleshooting

### Chaincode containers not starting?
```powershell
# Check image exists
docker images | findstr ccc01

# Rebuild
cd fabric-samples/test-network
docker build -f ../asset-transfer-basic/chaincode-javascript/Dockerfile `
  -t ccc01_ccaas_image:latest `
  --build-arg CC_SERVER_PORT=9999 `
  ../asset-transfer-basic/chaincode-javascript/
```

### "Access denied" errors?
```powershell
cd node-sdk
Remove-Item wallet/govUserTom.id -Force
node registerGovAdmin.js
node registerGOVAdminUser.js
```

### Need fresh start?
```powershell
.\stop-network.ps1
docker system prune -f
.\setup-network.ps1
```

---

## 📚 Documentation

- **Quick Start Guide**: [QUICKSTART.md](QUICKSTART.md)
- **Full Configuration**: [config.txt](config.txt)
- **API Endpoints**: See output of previous AI response

---

## 🎯 Key Benefits

✅ **One-command deployment** - No manual steps needed
✅ **Persistent configuration** - Survives network restarts
✅ **Auto-restart containers** - Automatic recovery on failure
✅ **Windows & Linux support** - PowerShell and Bash versions
✅ **No more syntax errors** - All CommonJS modules
✅ **Proper CCAAS mode** - Chaincode as a Service working correctly

---

## 📞 Support

If you encounter issues:
1. Check logs: `docker logs peer0org1_ccc01_ccaas`
2. Verify containers: `docker ps --filter name=ccc01`
3. Review [QUICKSTART.md](QUICKSTART.md) for detailed troubleshooting
