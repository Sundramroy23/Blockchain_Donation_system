# PowerShell script to deploy chaincode
# Windows-friendly version of deploy-chaincode.sh

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   Charity Donation Chaincode Deploy" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

$CHAINCODE_NAME = "ccc01"

Set-Location "fabric-samples/test-network"

# Cleanup: Stop and remove old chaincode containers if they exist
Write-Host "Cleaning up old chaincode containers..." -ForegroundColor Yellow
wsl -d Ubuntu bash -c 'docker stop peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas 2>/dev/null; docker rm peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas 2>/dev/null; true'
Write-Host "✓ Cleanup complete`n" -ForegroundColor Green

# Step 1: Check if chaincode Docker image exists
Write-Host "[1/3] Checking chaincode Docker image..." -ForegroundColor Yellow
$imageCheck = wsl -d Ubuntu bash -c 'docker images -q ccc01_ccaas_image:latest'

if ($imageCheck) {
    Write-Host "✓ Chaincode image already exists, skipping build`n" -ForegroundColor Green
} else {
    Write-Host "Building chaincode Docker image..." -ForegroundColor Yellow
    wsl -d Ubuntu bash -c 'cd /mnt/d/blockchain/fabric-samples/test-network && docker build -f ../asset-transfer-basic/chaincode-javascript/Dockerfile -t ccc01_ccaas_image:latest --build-arg CC_SERVER_PORT=9999 ../asset-transfer-basic/chaincode-javascript'
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to build chaincode image" -ForegroundColor Red
        Set-Location "../.."
        exit 1
    }
    Write-Host "✓ Chaincode image built successfully`n" -ForegroundColor Green
}

# Step 2: Deploy chaincode using deployCCAAS
Write-Host "[2/3] Deploying chaincode to network..." -ForegroundColor Yellow
wsl -d Ubuntu bash -c 'cd /mnt/d/blockchain/fabric-samples/test-network && ./network.sh deployCCAAS -ccn ccc01 -ccv 1.0 -ccs 1 -ccp ../asset-transfer-basic/chaincode-javascript'

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to deploy chaincode" -ForegroundColor Red
    Set-Location "../.."
    exit 1
}
Write-Host "✓ Chaincode deployed successfully`n" -ForegroundColor Green

# Step 3: Verify chaincode containers are running
Write-Host "[3/3] Verifying chaincode containers..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$containerCount = docker ps --filter "name=ccc01" --format "{{.Names}}" | Measure-Object | Select-Object -ExpandProperty Count

if ($containerCount -eq 3) {
    Write-Host "✓ All 3 chaincode containers are running`n" -ForegroundColor Green
    docker ps --filter "name=ccc01" --format "table {{.Names}}`t{{.Status}}"
} else {
    Write-Host "⚠ Found ${containerCount} containers, expected 3" -ForegroundColor Yellow
    Write-Host "Note: network.sh deployCCAAS already started the containers" -ForegroundColor Yellow
    docker ps --filter "name=ccc01" --format "table {{.Names}}`t{{.Status}}"
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   Deployment Complete! ✓" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Chaincode: ccc01"
Write-Host "Version: 1.0"
Write-Host "Channel: mychannel"
Write-Host "`nYou can now test the chaincode with your Node.js application."

Set-Location "../.."
