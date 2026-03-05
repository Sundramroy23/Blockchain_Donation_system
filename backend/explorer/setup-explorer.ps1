param(
  [switch]$Start
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$templatePath = Join-Path $scriptDir 'connection-profile\test-network.template.json'
$outputPath = Join-Path $scriptDir 'connection-profile\test-network.json'
$envExamplePath = Join-Path $scriptDir '.env.example'
$envPath = Join-Path $scriptDir '.env'

$org1KeyDir = Join-Path $scriptDir '..\fabric-samples\test-network\organizations\peerOrganizations\org1.example.com\users\Admin@org1.example.com\msp\keystore'
$org1KeyDir = [System.IO.Path]::GetFullPath($org1KeyDir)

if (-not (Test-Path $org1KeyDir)) {
  throw "Org1 keystore not found at: $org1KeyDir. Ensure test-network is up and crypto material exists."
}

$keyFile = Get-ChildItem -Path $org1KeyDir -File | Select-Object -First 1
if (-not $keyFile) {
  throw "No private key file found in: $org1KeyDir"
}

$template = Get-Content -Raw -Path $templatePath
$rendered = $template.Replace('__ORG1_ADMIN_KEY_FILE__', $keyFile.Name)
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outputPath, $rendered, $utf8NoBom)

if (-not (Test-Path $envPath)) {
  Copy-Item -Path $envExamplePath -Destination $envPath
}

Write-Host "Explorer profile generated: $outputPath"
Write-Host "Using Org1 key file: $($keyFile.Name)"
Write-Host "Environment file: $envPath"

if ($Start) {
  Push-Location $scriptDir
  try {
    docker compose --env-file .env -f docker-compose.yaml up -d
    Write-Host "Hyperledger Explorer started. Open: http://localhost:8081"
  }
  finally {
    Pop-Location
  }
}
else {
  Write-Host "Run this to start Explorer:"
  Write-Host "  Set-Location `"$scriptDir`"; docker compose --env-file .env -f docker-compose.yaml up -d"
}
