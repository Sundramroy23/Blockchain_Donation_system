# PowerShell script to stop the complete network
# Windows-friendly version of stop-network.sh

$ErrorActionPreference = "Continue"

Write-Host "`n=========================================" -ForegroundColor Blue
Write-Host "  Stopping Blockchain Charity Network" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue

# Step 1: Stop chaincode containers first
Write-Host "`n[1/4] Stopping chaincode containers..." -ForegroundColor Yellow

# Stop using docker-compose if file exists
$composeFile = "fabric-samples/test-network/compose/compose-ccc01-ccaas.yaml"
if (Test-Path $composeFile) {
    wsl -d Ubuntu bash -c 'cd /mnt/d/blockchain/fabric-samples/test-network && docker-compose -f compose/compose-ccc01-ccaas.yaml down 2>/dev/null' | Out-Null
}

# Force stop and remove any remaining chaincode containers
docker stop peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas 2>$null | Out-Null
docker rm peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas 2>$null | Out-Null

Write-Host "✓ Chaincode containers stopped" -ForegroundColor Green

# Step 2: Stop Explorer containers (best effort)
Write-Host "`n[2/4] Stopping Hyperledger Explorer containers..." -ForegroundColor Yellow
$explorerCompose = "explorer/docker-compose.yaml"
if (Test-Path $explorerCompose) {
    Set-Location "explorer"
    docker compose --env-file .env -f docker-compose.yaml down 2>$null | Out-Null
    Set-Location ".."
    Write-Host "✓ Explorer containers stopped" -ForegroundColor Green
}
else {
    Write-Host "! Explorer compose file not found, skipping" -ForegroundColor Yellow
}

# Step 3: Stop the Fabric network
Write-Host "`n[3/4] Stopping Fabric network..." -ForegroundColor Yellow
Set-Location "fabric-samples/test-network"
wsl -d Ubuntu bash -c 'cd /mnt/d/blockchain/fabric-samples/test-network && ./network.sh down'
Set-Location "../.."

# Step 4: Clear local wallet certificates
Write-Host "`n[4/4] Clearing node-sdk wallet certificates..." -ForegroundColor Yellow
$walletPath = "node-sdk/wallet"
if (Test-Path $walletPath) {
    Remove-Item "$walletPath/*" -Force -Recurse -ErrorAction SilentlyContinue
    Write-Host "✓ Wallet certificates cleared" -ForegroundColor Green
}
else {
    Write-Host "! Wallet directory not found, skipping" -ForegroundColor Yellow
}

Write-Host "`n=========================================" -ForegroundColor Blue
Write-Host "  Network Stopped Successfully! ✓" -ForegroundColor Blue
Write-Host "=========================================" -ForegroundColor Blue
