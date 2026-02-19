# PowerShell script for complete network setup
# Windows-friendly version of setup-network.sh

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "  Blockchain Charity Network Setup" -ForegroundColor Blue
Write-Host "========================================`n" -ForegroundColor Blue

# Check if network is already running
$peerRunning = docker ps | Select-String "peer0.org1.example.com"
if ($peerRunning) {
    Write-Host "Network is already running. Cleaning up first..." -ForegroundColor Yellow
    Set-Location "fabric-samples/test-network"
    wsl -d Ubuntu bash -c 'cd /mnt/d/blockchain/fabric-samples/test-network && ./network.sh down'
    Set-Location "../.."
}

# Step 1: Bring up the network with 2 orgs
Write-Host "`n[1/4] Starting network with Org1 and Org2..." -ForegroundColor Green
Set-Location "fabric-samples/test-network"
wsl -d Ubuntu bash -c 'cd /mnt/d/blockchain/fabric-samples/test-network && ./network.sh up createChannel -c mychannel -ca -s couchdb'

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start network" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Network up with 2 organizations`n" -ForegroundColor Green

# Step 2: Add Org3 to the network
Write-Host "[2/4] Adding Org3 to the network..." -ForegroundColor Green
Set-Location "addOrg3"
wsl -d Ubuntu bash -c 'cd /mnt/d/blockchain/fabric-samples/test-network/addOrg3 && ./addOrg3.sh up -ca -s couchdb'

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to add Org3" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Org3 added successfully`n" -ForegroundColor Green

Set-Location "../../.."

# Step 3: Deploy chaincode
Write-Host "[3/4] Deploying chaincode..." -ForegroundColor Green
$deployResult = & "$PSScriptRoot\deploy-chaincode.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to deploy chaincode" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Chaincode deployed successfully`n" -ForegroundColor Green

# Step 4: Setup admin certificates
Write-Host "[4/4] Setting up admin certificates..." -ForegroundColor Green
Set-Location "node-sdk"

# Register Org2 Admin (Government)
if (-not (Test-Path "wallet/govAdmin.id")) {
    Write-Host "Registering govAdmin..."
    node registerGovAdmin.js
}

# Register Org3 Admin (NGO)
if (-not (Test-Path "wallet/ngoAdmin.id")) {
    Write-Host "Registering ngoAdmin..."
    node registerNGOAdmin.js
}

# Register sample users
if (-not (Test-Path "wallet/govUserTom.id")) {
    Write-Host "Registering govUserTom..."
    node registerGOVAdminUser.js
}

if (-not (Test-Path "wallet/ngoAdminUser.id")) {
    Write-Host "Registering ngoAdminUser..."
    node registerNGOAdminUser.js
}

Set-Location ".."

Write-Host "`n========================================" -ForegroundColor Blue
Write-Host "   Setup Complete! ✓" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host "`nNetwork Status:" -ForegroundColor Green
Write-Host "  • Org1MSP (Platform) - peer0.org1.example.com"
Write-Host "  • Org2MSP (Government) - peer0.org2.example.com"
Write-Host "  • Org3MSP (NGO) - peer0.org3.example.com"
Write-Host "  • Channel: mychannel"
Write-Host "  • Chaincode: ccc01 v1.0"
Write-Host "`nRegistered Users:" -ForegroundColor Green
Write-Host "  • govAdmin (Org2)"
Write-Host "  • govUserTom (Org2)"
Write-Host "  • ngoAdmin (Org3)"
Write-Host "  • ngoAdminUser (Org3)"
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Start Node.js API: cd node-sdk && npm run dev"
Write-Host "  2. Test API: http://localhost:5000"
Write-Host "`nTo stop the network: .\stop-network.ps1"
