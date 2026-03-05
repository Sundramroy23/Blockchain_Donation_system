# Hyperledger Explorer (Isolated Setup)

This setup runs Hyperledger Explorer as a **separate service** for your Fabric test network.
It does not modify your chaincode, Node SDK API, or React frontend.

## What it is

- Hyperledger Explorer is an external blockchain explorer UI for Hyperledger Fabric.
- It is **not built-in** to Fabric and **not a framework for your app**.
- Think of it as an observability/audit tool for channels, blocks, txns, peers, and chaincode activity.

## Prerequisites

- Docker Desktop (with `docker compose`) running
- Fabric network up (`fabric_test` network exists)
- Crypto material present under:
  - `../fabric-samples/test-network/organizations`
- Channel `mychannel` and peer `peer0.org1.example.com` available

## Files

- `docker-compose.yaml` - Explorer + Postgres services
- `Dockerfile.explorer` - Local patched Explorer image (LSCC-safe fallback to `_lifecycle`)
- `config.json` - Explorer network config pointer
- `.env.example` - env template
- `connection-profile/test-network.template.json` - connection profile template
- `setup-explorer.ps1` - bootstrap script that injects correct Org1 admin key filename

## LSCC Compatibility Patch (Option B)

This setup builds a local Explorer image (`local/hyperledger-explorer:patched`) that safely handles Fabric networks where `lscc` is unavailable.

- If `lscc:GetChaincodes` fails, Explorer logs a warning and falls back to `_lifecycle:QueryChaincodeDefinitions`.
- This patch is isolated to Explorer only and does not modify your backend API, frontend, or chaincode.

## Setup

From `backend/explorer`:

```powershell
./setup-explorer.ps1
```

This will:

- Generate `connection-profile/test-network.json`
- Create `.env` from `.env.example` if missing

## Start Explorer

```powershell
docker compose --env-file .env -f docker-compose.yaml up -d
```

Or one-shot setup + start:

```powershell
./setup-explorer.ps1 -Start
```

Open UI at:

- `http://localhost:8081`

## Stop Explorer

```powershell
docker compose --env-file .env -f docker-compose.yaml down
```

## After Fabric Network Restart

If you bring Fabric down and up again, run:

```powershell
Set-Location "D:\blockchain\backend\explorer"
./recover-explorer.ps1
```

This does three safe steps:

- Verifies Docker network `fabric_test` exists
- Regenerates Explorer connection profile (`setup-explorer.ps1`)
- Recreates Explorer containers with fresh volumes (clears stale Explorer wallet/DB state) and waits for `http://localhost:8081`

## Integration effort

- Effort: **easy** (low risk)
- Runtime impact on your app: **none** (separate containers)
- Optional app integration: add a link/button in frontend to open Explorer URL.
