# 🧪 API Testing Resources

This folder contains everything you need to test all APIs in the Blockchain Donation Tracking System.

## 📁 Files Overview

### 1. **API-TESTING-GUIDE.md**
Complete documentation with:
- All 23 API endpoints
- Request/response examples
- cURL commands
- Complete testing workflow
- Troubleshooting tips

### 2. **Postman Collection**
`postman/Blockchain-Donation-API.postman_collection.json`

Import this into Postman for interactive API testing with:
- Pre-configured requests
- Request bodies
- Environment variables
- Organized by categories (Users, Funds, Tokens, Pinata)

### 3. **Automated Test Scripts**

#### PowerShell (Windows)
```powershell
.\test-all-apis.ps1
```

#### Bash (Linux/WSL)
```bash
chmod +x test-all-apis.sh
./test-all-apis.sh
```

These scripts automatically:
- Test all 22 endpoints in sequence
- Display colored output (✓ pass / ✗ fail)
- Show JSON responses
- Provide summary report

## 🚀 Quick Start

### Prerequisites
1. **Start the blockchain network:**
   ```powershell
   .\setup-network.ps1
   ```

2. **Start the API server:**
   ```powershell
   cd node-sdk
   npm run dev
   ```

3. **Verify server is running:**
   ```
   http://localhost:5000
   ```

### Option A: Automated Testing (Recommended)

**Windows:**
```powershell
.\test-all-apis.ps1
```

**Linux/WSL:**
```bash
./test-all-apis.sh
```

### Option B: Manual Testing with Postman

1. Open Postman
2. Import collection: `postman/Blockchain-Donation-API.postman_collection.json`
3. Verify base URL: `http://localhost:5000`
4. Run tests in this order:
   - Users → Tokens → Funds

### Option C: Manual cURL Testing

See [API-TESTING-GUIDE.md](API-TESTING-GUIDE.md) for individual cURL commands.

## 📊 API Categories

### 👥 Users (9 endpoints)
- Register/Get Donor
- Register/Get NGO
- Register/Get Bank
- Get All (Banks/NGOs/Donors)

### 💰 Funds (8 endpoints)
- Create Fund
- Donate to Fund
- Add Expense
- Close Fund
- Get Fund(s)
- Query by NGO/Donor

### 🪙 Tokens (4 endpoints)
- Issue Token (Bank)
- Transfer Token
- Redeem Token (NGO)
- Get Tokens by Bank

### 📌 Pinata (2 endpoints)
- Pin JSON to IPFS
- Pin Image to IPFS

## 🔍 Testing Workflow

```
1. Register Bank    →  bank001
2. Register NGO     →  ngo001
3. Register Donor   →  donor001
4. Issue Token      →  token001 (Bank → FundManager)
5. Transfer Token   →  token001 (FundManager → Donor)
6. Create Fund      →  fund001 (NGO creates)
7. Donate to Fund   →  Donor donates using token
8. Add Expense      →  NGO records spending
9. Redeem Token     →  NGO redeems for cash
10. Close Fund      →  Mark fund as completed
```

## 📋 Sample Test Data

### Bank
```json
{
  "bankId": "bank001",
  "name": "State Bank of India",
  "branch": "Mumbai Central",
  "ifscCode": "SBIN0001234"
}
```

### NGO
```json
{
  "ngoId": "ngo001",
  "name": "Save The Children India",
  "regNo": "NGO123456",
  "address": "123 Charity Street, Mumbai",
  "contact": "+91-9876543210",
  "description": "Child welfare and education"
}
```

### Donor
```json
{
  "donorId": "donor001",
  "name": "John Doe",
  "email": "john@example.com",
  "alias": "johndoe"
}
```

### Token
```json
{
  "bankId": "bank001",
  "fundManagerId": "manager001",
  "amount": 100000
}
```

### Fund
```json
{
  "fundId": "fund001",
  "ngoId": "ngo001",
  "title": "Education for Street Children",
  "purpose": "Provide education materials"
}
```

## 🎯 Expected Responses

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## 🐛 Troubleshooting

### API Server Not Running
```powershell
cd node-sdk
npm run dev
```

### Blockchain Network Down
```powershell
.\setup-network.ps1
```

### Chaincode Issues
```bash
# Check container logs
docker logs peer0org1_ccc01_ccaas
docker logs peer0org2_ccc01_ccaas
docker logs peer0org3_ccc01_ccaas

# Restart network
.\stop-network.ps1
.\setup-network.ps1
```

### Port Already in Use
```powershell
# Windows - Kill process on port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process

# Linux/WSL
sudo lsof -ti:5000 | xargs kill
```

## 📖 Additional Resources

- **Blockchain Network Setup:** [QUICKSTART.md](QUICKSTART.md)
- **Complete Documentation:** [README.md](README.md)
- **Stop Network:** `.\stop-network.ps1`
- **API Source Code:** `node-sdk/`
- **Smart Contracts:** `fabric-samples/asset-transfer-basic/chaincode-javascript/`

## 💡 Pro Tips

1. **Test in Sequence:** Follow the numbering in test scripts for logical flow
2. **Check Logs:** Monitor `npm run dev` terminal for real-time errors
3. **Use Postman Environment:** Set `baseUrl` variable for easy switching
4. **Save Token IDs:** Dynamic IDs are returned after token issuance
5. **Pretty Print JSON:** Use `jq` (Linux) or `| ConvertTo-Json` (PowerShell)

## 🔐 Security Notes

- This is a **development environment**
- No authentication/authorization implemented
- Do not use in production without security enhancements
- Sensitive data should be encrypted in production

## 📞 Need Help?

- Check API logs: Terminal running `npm run dev`
- Check chaincode logs: `docker logs peer0org1_ccc01_ccaas`
- Verify containers: `docker ps`
- Check network: `docker network ls`

---

**Last Updated:** February 2026  
**Version:** 1.0  
**Hyperledger Fabric:** 2.5.12
