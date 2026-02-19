# API Testing Guide - Blockchain Donation Tracking System

Base URL: `http://localhost:5000`

## 📋 Table of Contents
1. [User APIs](#user-apis)
2. [Fund APIs](#fund-apis)
3. [Token APIs](#token-apis)
4. [Pinata APIs](#pinata-apis)

---

## 🧑 USER APIS

### 1. Register Donor
**POST** `/api/users/donor`

**Request Body:**
```json
{
  "donorId": "donor001",
  "name": "John Doe",
  "email": "john@example.com",
  "alias": "johndoe"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/users/donor \
  -H "Content-Type: application/json" \
  -d '{
    "donorId": "donor001",
    "name": "John Doe",
    "email": "john@example.com",
    "alias": "johndoe"
  }'
```

---

### 2. Get Donor
**GET** `/api/users/donor?donorId=donor001`

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/users/donor?donorId=donor001"
```

---

### 3. Register NGO
**POST** `/api/users/ngo`

**Request Body:**
```json
{
  "ngoId": "ngo001",
  "name": "Save The Children India",
  "regNo": "NGO123456",
  "address": "123 Charity Street, Mumbai, India",
  "contact": "+91-9876543210",
  "description": "Working for child welfare and education"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/users/ngo \
  -H "Content-Type: application/json" \
  -d '{
    "ngoId": "ngo001",
    "name": "Save The Children India",
    "regNo": "NGO123456",
    "address": "123 Charity Street, Mumbai, India",
    "contact": "+91-9876543210",
    "description": "Working for child welfare and education"
  }'
```

---

### 4. Get NGO
**GET** `/api/users/ngo?ngoId=ngo001`

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/users/ngo?ngoId=ngo001"
```

---

### 5. Register Bank
**POST** `/api/users/bank`

**Request Body:**
```json
{
  "bankId": "bank001",
  "name": "State Bank of India",
  "branch": "Mumbai Central",
  "ifscCode": "SBIN0001234"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/users/bank \
  -H "Content-Type: application/json" \
  -d '{
    "bankId": "bank001",
    "name": "State Bank of India",
    "branch": "Mumbai Central",
    "ifscCode": "SBIN0001234"
  }'
```

---

### 6. Get Bank
**GET** `/api/users/bank?bankId=bank001`

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/users/bank?bankId=bank001"
```

---

### 7. Get All Banks
**GET** `/api/users/allBank`

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/users/allBank"
```

---

### 8. Get All Donors
**GET** `/api/users/allDonor`

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/users/allDonor"
```

---

### 9. Get All NGOs
**GET** `/api/users/allNGO`

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/users/allNGO"
```

---

## 💰 FUND APIS

### 10. Create Fund
**POST** `/api/funds`

**Request Body:**
```json
{
  "fundId": "fund001",
  "ngoId": "ngo001",
  "title": "Education for Street Children",
  "purpose": "Provide education materials and school fees for underprivileged children"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/funds \
  -H "Content-Type: application/json" \
  -d '{
    "fundId": "fund001",
    "ngoId": "ngo001",
    "title": "Education for Street Children",
    "purpose": "Provide education materials and school fees for underprivileged children"
  }'
```

---

### 11. Get All Funds
**GET** `/api/funds`

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/funds"
```

---

### 12. Get Fund by ID
**GET** `/api/funds/:fundId`

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/funds/fund001"
```

---

### 13. Donate to Fund
**POST** `/api/funds/:fundId/donate`

**Request Body:**
```json
{
  "donorId": "donor001",
  "tokenId": "token001",
  "amount": 5000
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/funds/fund001/donate \
  -H "Content-Type: application/json" \
  -d '{
    "donorId": "donor001",
    "tokenId": "token001",
    "amount": 5000
  }'
```

---

### 14. Add Expense to Fund
**POST** `/api/funds/:fundId/expense`

**Request Body:**
```json
{
  "description": "Purchased school books and uniforms",
  "amount": 2000,
  "spenderId": "vendor001"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/funds/fund001/expense \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Purchased school books and uniforms",
    "amount": 2000,
    "spenderId": "vendor001"
  }'
```

---

### 15. Close Fund
**GET** `/api/funds/:fundId/close`

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/funds/fund001/close"
```

---

### 16. Get All Funds by NGO
**GET** `/api/funds/ngo/:ngoId/funds`

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/funds/ngo/ngo001/funds"
```

---

### 17. Get All Donations by Donor
**GET** `/api/funds/donor/:donorId/donations`

**cURL:**
```bash
curl -X GET "http://localhost:5000/api/funds/donor/donor001/donations"
```

---

## 🪙 TOKEN APIS

### 18. Issue Token
**POST** `/api/tokens/issue`

**Request Body:**
```json
{
  "bankId": "bank001",
  "fundManagerId": "manager001",
  "amount": 100000
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/tokens/issue \
  -H "Content-Type: application/json" \
  -d '{
    "bankId": "bank001",
    "fundManagerId": "manager001",
    "amount": 100000
  }'
```

---

### 19. Transfer Token
**POST** `/api/tokens/transfer`

**Request Body:**
```json
{
  "tokenId": "token001",
  "toId": "donor001"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/tokens/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "token001",
    "toId": "donor001"
  }'
```

---

### 20. Redeem Token
**POST** `/api/tokens/redeem`

**Request Body:**
```json
{
  "tokenId": "token001",
  "ngoId": "ngo001"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/tokens/redeem \
  -H "Content-Type: application/json" \
  -d '{
    "tokenId": "token001",
    "ngoId": "ngo001"
  }'
```

---

### 21. Get Tokens by Bank
**POST** `/api/tokens/byBank`

**Request Body:**
```json
{
  "bankId": "bank001"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/tokens/byBank \
  -H "Content-Type: application/json" \
  -d '{
    "bankId": "bank001"
  }'
```

---

## 📌 PINATA APIS

### 22. Pin JSON to IPFS
**POST** `/api/pinata/json`

**Request Body:**
```json
{
  "data": {
    "fundId": "fund001",
    "title": "Education for Street Children",
    "description": "Full fund details and transactions"
  },
  "name": "fund001-metadata"
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/pinata/json \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "fundId": "fund001",
      "title": "Education for Street Children",
      "description": "Full fund details and transactions"
    },
    "name": "fund001-metadata"
  }'
```

---

### 23. Pin Image to IPFS
**POST** `/api/pinata/image`

**Request Body:** (Multipart form-data)
- `file`: Image file

**cURL:**
```bash
curl -X POST http://localhost:5000/api/pinata/image \
  -F "file=@/path/to/image.jpg"
```

---

## 🧪 COMPLETE TESTING WORKFLOW

### Step 1: Setup Users
```bash
# 1. Register Bank
curl -X POST http://localhost:5000/api/users/bank \
  -H "Content-Type: application/json" \
  -d '{"bankId":"bank001","name":"SBI","branch":"Mumbai","ifscCode":"SBIN0001234"}'

# 2. Register NGO
curl -X POST http://localhost:5000/api/users/ngo \
  -H "Content-Type: application/json" \
  -d '{"ngoId":"ngo001","name":"Save Children","regNo":"NGO123","address":"Mumbai","contact":"9876543210","description":"Child welfare"}'

# 3. Register Donor
curl -X POST http://localhost:5000/api/users/donor \
  -H "Content-Type: application/json" \
  -d '{"donorId":"donor001","name":"John Doe","email":"john@example.com","alias":"johndoe"}'
```

### Step 2: Token Operations
```bash
# 4. Issue Token
curl -X POST http://localhost:5000/api/tokens/issue \
  -H "Content-Type: application/json" \
  -d '{"bankId":"bank001","fundManagerId":"manager001","amount":100000}'

# 5. Transfer Token to Donor
curl -X POST http://localhost:5000/api/tokens/transfer \
  -H "Content-Type: application/json" \
  -d '{"tokenId":"token001","toId":"donor001"}'
```

### Step 3: Fund Operations
```bash
# 6. Create Fund
curl -X POST http://localhost:5000/api/funds \
  -H "Content-Type: application/json" \
  -d '{"fundId":"fund001","ngoId":"ngo001","title":"Education","purpose":"School supplies"}'

# 7. Donate to Fund
curl -X POST http://localhost:5000/api/funds/fund001/donate \
  -H "Content-Type: application/json" \
  -d '{"donorId":"donor001","tokenId":"token001","amount":5000}'

# 8. Add Expense
curl -X POST http://localhost:5000/api/funds/fund001/expense \
  -H "Content-Type: application/json" \
  -d '{"description":"Books purchased","amount":2000,"spenderId":"vendor001"}'
```

### Step 4: Query Data
```bash
# 9. Get All Banks
curl -X GET "http://localhost:5000/api/users/allBank"

# 10. Get All NGOs
curl -X GET "http://localhost:5000/api/users/allNGO"

# 11. Get All Donors
curl -X GET "http://localhost:5000/api/users/allDonor"

# 12. Get All Funds
curl -X GET "http://localhost:5000/api/funds"

# 13. Get Fund Details
curl -X GET "http://localhost:5000/api/funds/fund001"

# 14. Get Donations by Donor
curl -X GET "http://localhost:5000/api/funds/donor/donor001/donations"
```

---

## 📝 POSTMAN COLLECTION

Import this into Postman for easier testing:

**File:** `postman/Blockchain-Donation-API.postman_collection.json`

---

## ⚠️ IMPORTANT NOTES

1. **Start the API server first:**
   ```bash
   cd node-sdk
   npm run dev
   ```

2. **Ensure blockchain network is running:**
   ```bash
   .\setup-network.ps1  # Windows
   ./setup-network.sh   # Linux
   ```

3. **Register admin certificates:**
   ```bash
   node registerGovAdmin.js
   node registerNGOAdmin.js
   ```

4. **Default Port:** 5000 (configurable via PORT env variable)

5. **Expected Response Format:**
   ```json
   {
     "success": true,
     "message": "Operation successful",
     "data": { ... }
   }
   ```

6. **Error Response Format:**
   ```json
   {
     "success": false,
     "message": "Error description",
     "error": "Detailed error"
   }
   ```

---

## 🔍 Testing Tips

- Use **Postman** or **Insomnia** for visual testing
- Use **curl** for command-line testing
- Check **Docker logs** if chaincode issues occur:
  ```bash
  docker logs peer0org1_ccc01_ccaas
  ```
- Monitor **API logs** in terminal running `npm run dev`
- Verify data on **blockchain** using peer commands
