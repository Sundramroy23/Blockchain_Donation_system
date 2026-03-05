param(
  [int]$Retries = 20,
  [int]$DelaySeconds = 3
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptDir
try {
  $networkName = 'fabric_test'
  $networkId = (docker network ls --filter "name=^${networkName}$" --format "{{.ID}}")
  if (-not $networkId) {
    throw "Docker network '$networkName' not found. Start Fabric network first, then run this script."
  }

  powershell -ExecutionPolicy Bypass -File .\setup-explorer.ps1

  docker compose --env-file .env -f docker-compose.yaml down -v
  docker compose --env-file .env -f docker-compose.yaml up -d --force-recreate

  $ok = $false
  for ($i = 1; $i -le $Retries; $i++) {
    try {
      $resp = Invoke-WebRequest -Uri "http://localhost:8081" -Method GET -UseBasicParsing -TimeoutSec 5
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
        $ok = $true
        break
      }
    } catch {
      Start-Sleep -Seconds $DelaySeconds
    }
  }

  if (-not $ok) {
    throw "Explorer did not become reachable on http://localhost:8081 after ${Retries} retries."
  }

  Write-Host "Explorer recovery complete. URL: http://localhost:8081"
}
finally {
  Pop-Location
}
