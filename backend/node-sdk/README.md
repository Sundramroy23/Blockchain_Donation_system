## Smart contract functions 

## ORGS 
    
- Org1 = PlatformMSP  -> Add new Org 
- Org2 = GovMSP  -> register GovAdmin Cert -> onboard Banks & goverment user
- Org3 = NGOMSP  -> registerNGOAdmin -> registerNGO's 

## User Types - user roles

- admin - org1
- govAdmin - org2
- govUser
- bankUser
- donor 
- ngoAdmin - org3
- ngoUser

## Operation by org types

###  Org1 - platfromMSP - patfrom user
    - add new org to the network ex: Org3, Org4..
    

###  Org2 - GovMSP - goverment user 
    - RegisterDonor
    - GetDonor
    - RegisterBank
    - GetBank
    - GetAllBanks
    - GetAllNGOs
    - GetAllDonors 
    - GetAllDonationsByDonor

#### Org2MSP - Bank Users
    - IssueToken   
    - TransferToken 

#### Org2MSP - Donner users
    - Donate 
    - GetAllFunds

###  Org3 - NGOMSP - ngo user

    NGO user with adminUser role
    - RegisterNGO 
    - GetNGO

    NGO user with ngoUser role   
    -  CreateFund
    - GetFund
    - CloseFund
    - AddExpense
    - GetAllFundsByNGO
    - RedeemToken



## Smart Contract

 - Users 
    - RegisterNGO by only by NGOMSP  -  RegisterNGO(ctx, ngoId, name, regNo, address, contact, description) 
    - GetNGO()ctx,  ngoId - anyone can call 

    - RegisterDonor | can called by anyone - RegisterDonor(ctx, donorId, name, email, alias)
    - GetDonor - donorId - GetDonor(ctx, donorId)

    - RegisterBank(ctx, bankId, name, branch, ifscCode) - only GovMSP can call
    - GetBank(ctx, bankId) - anyone can call based on bankId

    - GetAllBanks(ctx) - call by GovMSP
    - GetAllNGos(ctx) - call by GovMSP
    - GetAllDonors(ctx) - call by GovMSP


- FundContract 
    - CreateFund(ctx, fundId, ngoId, title, purpose) - by NGOMSP
    - Donate(ctx, fundId, donorId, tokenId, amount) - call by anyone
    - AddExpense(ctx, fundId, description, amount, spenderId) - call by (only NGO org) - (spenderId == vendorId)

    - GetFund(ctx, fundId) by id - anyone can call
    - CloseFund(ctx, fundId) - NGOMSP and GovMSP can call.
    - GetAllFundsByNGO(ctx, ngoId) - anyone can call.
    - GetAllFunds(ctx) - anyone can call.
    - GetAllDonationsByDonor(ctx, donorId) - anyome can call - used in donoar ui

- TokenContract 
    - IssueToken(ctx, bankId, fundManagerId, amount) - only bank can call
    - TransferToken(ctx, tokenId, toId) -  bank can call.
    - RedeemToken(ctx, tokenId, ngoId) - NGOMSP can call

## Badge Generation Toggle

- `ENABLE_BADGE_GENERATION=false` (default): skips Pinata/IPFS badge generation for API flows (register donor/ngo/bank and donate), reducing latency.
- `ENABLE_BADGE_GENERATION=true`: enables badge generation again.
- `BADGE_GENERATION_TIMEOUT_MS=1200` (optional): max wait time for badge generation before safely continuing without CID.

When disabled, timed out, or failed, the API still completes blockchain transactions with an empty badge link so core flows do not break.

## Research Metrics API

For research-paper data collection, the backend now exposes computed metrics at:

- `GET /api/research/stats`
- `GET /api/research/stats.csv`
- `GET /api/research/stats-paper.csv` (filtered columns for paper tables)
- `POST /api/research/stats/reset`

The response includes these metrics:

- Transaction Latency
- Throughput
- Block Creation Time
- Success Rate
- Token Balance Accuracy (also returned as Token Accuracy)
- Transparency Index
- Cost Efficiency

Each metric is tagged with `source` (`measured`, `hybrid`, or `estimated`).
If runtime observations are missing, realistic defaults are used so the report remains complete.

### CLI Snapshot

Run from `backend/node-sdk`:

```bash
npm run research:stats
```

Optional environment variables:

- `RESEARCH_API_BASE_URL` (default: `http://localhost:5000`)
- `ASSUMED_BLOCK_CREATION_SEC`
- `ASSUMED_TOKEN_ACCURACY_PCT`
- `ASSUMED_TRANSPARENCY_INDEX`
- `ASSUMED_COST_PER_TX_USD`