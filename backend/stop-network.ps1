param(
    [switch]$FreshStart
)

# PowerShell script to stop the complete network.
# Windows-friendly version of stop-network.sh.

$ErrorActionPreference = 'Continue'

Set-Location $PSScriptRoot
$wslRepoRoot = '/mnt/d/blockchain/backend'

function Remove-IfExists {
    param([string]$PathToRemove)

    if (Test-Path $PathToRemove) {
        Remove-Item $PathToRemove -Force -Recurse -ErrorAction SilentlyContinue
    }
}

function Remove-FabricVolumes {
    $fabricVolumes = @(
        'orderer.example.com',
        'peer0.org1.example.com',
        'peer0.org2.example.com',
        'peer0.org3.example.com'
    )

    foreach ($volumeName in $fabricVolumes) {
        docker volume rm $volumeName 2>$null | Out-Null
    }
}

Write-Host "`n=========================================" -ForegroundColor Blue
Write-Host '  Stopping Blockchain Charity Network' -ForegroundColor Blue
Write-Host '=========================================' -ForegroundColor Blue

Write-Host "`n[1/5] Stopping chaincode containers..." -ForegroundColor Yellow

$composeFile = 'fabric-samples/test-network/compose/compose-ccc01-ccaas.yaml'
if (Test-Path $composeFile) {
    wsl -d Ubuntu bash -c "cd $wslRepoRoot/fabric-samples/test-network; docker-compose -f compose/compose-ccc01-ccaas.yaml down 2>/dev/null" | Out-Null
}

docker stop peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas 2>$null | Out-Null
docker rm peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas 2>$null | Out-Null

Write-Host 'Chaincode containers stopped' -ForegroundColor Green

Write-Host "`n[2/5] Stopping Hyperledger Explorer containers..." -ForegroundColor Yellow
$explorerCompose = 'explorer/docker-compose.yaml'
if (Test-Path $explorerCompose) {
    Push-Location 'explorer'
    docker compose --env-file .env -f docker-compose.yaml down 2>$null | Out-Null
    Pop-Location
    Write-Host 'Explorer containers stopped' -ForegroundColor Green
}
else {
    Write-Host 'Explorer compose file not found, skipping' -ForegroundColor Yellow
}

Write-Host "`n[3/5] Stopping Fabric network..." -ForegroundColor Yellow
Push-Location 'fabric-samples/test-network'
wsl -d Ubuntu bash -c "cd $wslRepoRoot/fabric-samples/test-network; ./network.sh down"
Pop-Location

if ($FreshStart) {
    Write-Host "`n[4/5] Removing Fabric ledger volumes..." -ForegroundColor Yellow
    Remove-FabricVolumes
    Write-Host 'Fabric volumes removed' -ForegroundColor Green
}

Write-Host "`n[4/5] Clearing node-sdk persisted state..." -ForegroundColor Yellow
$stateFiles = @(
    'node-sdk/data/approvals.json',
    'node-sdk/data/ngoRegistry.json',
    'node-sdk/data/govUsers.json',
    'node-sdk/data/auth.db',
    'node-sdk/data/sessions.sqlite',
    'node-sdk/data/sessions.sqlite-shm',
    'node-sdk/data/sessions.sqlite-wal'
)

foreach ($stateFile in $stateFiles) {
    Remove-IfExists -PathToRemove $stateFile
}

Write-Host 'Node SDK state cleared' -ForegroundColor Green

Write-Host "`n[5/5] Clearing node-sdk wallet certificates..." -ForegroundColor Yellow
$walletPath = 'node-sdk/wallet'
if (Test-Path $walletPath) {
    Remove-Item "$walletPath/*" -Force -Recurse -ErrorAction SilentlyContinue
    Write-Host 'Wallet certificates cleared' -ForegroundColor Green
}
else {
    Write-Host 'Wallet directory not found, skipping' -ForegroundColor Yellow
}

Write-Host "`n=========================================" -ForegroundColor Blue
Write-Host '  Network Stopped Successfully!' -ForegroundColor Blue
Write-Host '=========================================' -ForegroundColor Blue
