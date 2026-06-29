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
 
## Approvals (admin-mediated transfers)

New lightweight approval flow (backend-driven allowance) to support admin approval without a bank server:

- `POST /api/approvals` — create approval (NGO): body `{ createdBy, fundId, ngoId, amount, description, note, receiptImages }`
- `receiptImages` is an array of image payloads from the frontend. Each item should include a `dataUrl` field created from `FileReader.readAsDataURL(...)`.
- `GET /api/approvals` — list approvals (admin), optional `?status=PENDING|APPROVED|FAILED`
- `POST /api/approvals/approve` — approve an approval (admin): body `{ approvalId, adminCert, verificationNote }` — backend marks the allowance as approved, verified, and redeemable.
- `POST /api/approvals/redeem` — redeem approved amount (NGO): body `{ approvalId, ngoId, amount }`
- `GET /api/approvals/ngo/:ngoId` — NGO view: approvals + totals (approved/pending/failed/redeemed/remaining)

Notes:
- Approvals are persisted in `data/approvals.json`.
 - Receipt images are stored on local disk under `data/approval-receipts/` and are served from `/local-storage/...` for review.
 - `stop-network.sh` and `stop-network.ps1` remove the approval receipt files during shutdown.
 - The approve/redeem flow is ledger-side allowance tracking, so no bank server is required.

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

### Demo Seeding

Run from `backend/node-sdk` after the wallet has `govUserTom` and `ngoAdminUser` enrolled. The API server does not need to be running for this command:

```bash
npm run seed:demo
```

This is idempotent. It creates up to 5 banks, 50 NGOs, and 2 or 3 campaigns per NGO, skipping anything that already exists.
The seeder now also enrolls wallet identities for the seeded banks (`bank001` through `bank005`) and NGOs (`ngo001` through `ngo050`) so the corresponding UI pages can sign transactions with the same business IDs they display.
If you get an MSP or wallet error, make sure `govUserTom` and `ngoAdminUser` are enrolled first. The first two come from `node registerGOVAdminUser.js` and `node registerNGOAdminUser.js`.

Optional environment variables:

- `SEED_API_BASE_URL` (default: `http://127.0.0.1:5000`)
- `SEED_API_TIMEOUT_MS` (default: `15000`)
- `SEED_BANK_COUNT` (default: `5`)
- `SEED_NGO_COUNT` (default: `50`)
- `SEED_GOV_USER_CERT` (default: `govUserTom`)
- `SEED_NGO_ADMIN_CERT` (default: `ngoAdminUser`)
- `SEED_NGO_USER_CERT` (default: `ngoUserSeed`)

## Testing and Validation

This chapter documents the test strategy, the validation flows used for the backend and blockchain integration, the fixtures used during testing, and the procedure followed to verify each subsystem. In this project, testing is centered on deterministic service logic, seeded demo data, and end-to-end API smoke checks rather than a large standalone unit-test suite.

### 8.1 Test Strategy

Testing is organised in four layers:

1. Unit-level validation of pure logic and deterministic helper functions, including identity handling, donor KYC rules, fund ID generation, research metrics aggregation, and token/status filtering.
2. Integration testing of API routes and blockchain calls, covering registration, authentication, token issuance, fund creation, donation, approvals, donor KYC review, and research statistics.
3. End-to-end smoke testing that starts the Express backend, loads demo identities and campaigns, and exercises the main donor, NGO, and admin workflows against the deployed Fabric network.
4. Stability and validation checks that confirm health endpoints, seeded records, and exported research metrics behave consistently across repeated runs.

The backend is structured so that most business rules live in small service and controller functions. This keeps the logic easy to validate in isolation, while the Fabric calls, file-backed records, and upload flows are exercised through integration tests and smoke tests.

### 8.2 Unit Tests - Core Logic

The project contains several modules that are suitable for unit testing because they do not depend heavily on external IO. These include donor identity and authorization checks, KYC status gating, fund validation rules, token ownership filtering, badge-generation fallbacks, and research-statistics aggregation.

The most important pure-logic areas are:

1. Donor approval logic, which ensures that top-up and donation flows only continue when the donor KYC status is approved.
2. Fund handling logic, which validates fund IDs, resolves balances, and blocks donations to disabled NGOs.
3. Token logic, which filters live tokens and prevents invalid transfer or donate operations.
4. Research metrics logic, which converts runtime observations into CSV and JSON outputs for reporting.
5. Local file-backed validation for approvals and donor KYC, which can be checked without requiring a full network restart.

These functions are well suited to fast tests because they return deterministic results from fixed inputs and can be validated with mocked Fabric and filesystem dependencies.

### 8.3 Integration Tests - API and Ledger Flows

Integration testing focuses on the routes that connect the API layer to the blockchain network. The key routes exercised are the authentication endpoints, user and fund operations, token issuance and transfer, donor KYC submission and review, approval creation and listing, and the research statistics endpoints.

Typical integration checks include:

1. Registering a donor, NGO, or bank user and confirming the record can be queried afterward.
2. Creating a fund and verifying it appears in the fund listing endpoints.
3. Issuing a token, transferring it, and confirming the resulting token state is reflected in the ledger.
4. Submitting donor KYC documents, reviewing them, and confirming that the donor status changes to approved.
5. Creating an approval request and confirming that receipt metadata is persisted correctly.
6. Fetching research statistics in JSON and CSV form to confirm the backend reports consistent metrics.

These tests validate the contract between the API layer and the Fabric service layer, which is the most important integration boundary in the project.

### 8.4 Fixtures and Test Data

Testing relies on seeded demo data and local storage fixtures that make the system repeatable across runs. The main fixture source is the demo seeder in [scripts/seedDemoData.js](scripts/seedDemoData.js), which creates banks, NGOs, campaign records, and the wallet identities needed for transaction signing.

The main fixtures used in validation are:

1. Demo identities such as govUserTom, ngoAdminUser, ngoUserSeed, and the bank and NGO wallet identities created by the seeder.
2. Ledger-side demo records for banks, NGOs, and campaigns.
3. Local file-backed records for approvals and donor KYC documents under the backend data directory.
4. Uploaded receipt and document images that are stored locally and served through the backend for review.

Because the demo seed process is idempotent, the same fixture set can be reused for repeated validation without manually rebuilding the network state each time.

### 8.5 End-to-End Smoke Test

The end-to-end smoke test validates the complete workflow from user registration through donation and approval handling. The recommended smoke procedure is:

1. Start the backend and confirm the service is running.
2. Run the demo seeding script to prepare banks, NGOs, campaigns, and wallet identities.
3. Register or load a donor identity and submit donor KYC if the flow requires it.
4. Issue a token, transfer it when required, and donate to an active fund.
5. Create and review an approval request if the workflow uses the approval path.
6. Query the fund, token, donor, and research endpoints to confirm the resulting state.

This smoke test is the fastest way to validate that the backend, filesystem-backed records, and Fabric transactions are working together correctly after a fresh deployment or code change.

### 8.6 Performance and Stability Checks

Performance validation in this project is based on the responsiveness of the API layer and the consistency of the research metrics endpoints. The backend exposes health checks and statistics endpoints that make it possible to confirm service availability and measure system behavior over time.

The main checks are:

1. Confirm that the health endpoint responds successfully.
2. Confirm that explorer connectivity is reported correctly when the explorer service is available.
3. Compare repeated donation, token, and fund operations for stable response behavior.
4. Export research metrics and verify that the output remains consistent across runs.

At present, the project emphasizes practical validation of correctness and workflow stability rather than a dedicated benchmark harness, but the exposed research metrics make it straightforward to add one later.