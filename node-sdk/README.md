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