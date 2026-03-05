# PowerShell script to resume the blockchain network
# Resumes previously stopped containers without reinitializing

$ErrorActionPreference = "Continue"

Write-Host "`nResuming Blockchain Charity Network..." -ForegroundColor Green

# Get all stopped containers related to the fabric network
Write-Host "`nResuming network containers..." -ForegroundColor Yellow
$stoppedContainers = docker ps -a --filter "status=exited" --filter "label=com.docker.compose.project" -q

if ($stoppedContainers) {
    docker start $stoppedContainers
    Write-Host "Network containers restarted" -ForegroundColor Green
}
else {
    Write-Host "No stopped containers found" -ForegroundColor Yellow
}

# Also start any peers that might be stopped
Write-Host "`nStarting peer containers..." -ForegroundColor Yellow
docker start peer0.org1.example.com peer0.org2.example.com peer0.org3.example.com 2>$null
docker start orderer.example.com 2>$null
docker start ca.org1.example.com ca.org2.example.com ca.org3.example.com 2>$null

# Wait for containers to start
Write-Host "`nWaiting for containers to stabilize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verify network is running
Write-Host "`nVerifying network status..." -ForegroundColor Yellow
$peerRunning = docker ps | Select-String "peer0.org"
if ($peerRunning) {
    Write-Host "Network is operational" -ForegroundColor Green
    docker ps --filter "label=com.docker.compose.service" --format "table {{.Names}}\t{{.Status}}" | Select-Object -First 10
}
else {
    Write-Host "Warning: Network containers may still be starting" -ForegroundColor Yellow
}

Write-Host "`nNetwork Resumed Successfully!" -ForegroundColor Blue
Write-Host "Your wallets and ledger state are preserved" -ForegroundColor Green
