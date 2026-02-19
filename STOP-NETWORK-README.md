# Stop Network Scripts - Important!

## Problem Fixed ✓

Previously, running `./network.sh down` would **NOT** stop the chaincode containers (`peer0org1_ccc01_ccaas`, `peer0org2_ccc01_ccaas`, `peer0org3_ccc01_ccaas`), leaving them running in the background.

## Solution

Use the new **stop-network** scripts which properly stop **EVERYTHING**:

### Windows (PowerShell)
```powershell
.\stop-network.ps1
```

### Linux/WSL
```bash
./stop-network.sh
```

## What Gets Stopped

These scripts will stop:
1. ✓ All 3 chaincode containers (ccc01_ccaas)
2. ✓ All peer nodes (Org1, Org2, Org3)
3. ✓ Orderer node
4. ✓ Certificate Authority (CA) containers
5. ✓ CouchDB state databases
6. ✓ Docker networks and volumes

## Individual Component Control

If you only want to stop chaincode containers (not the whole network):

```powershell
# Windows
docker stop peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas
docker rm peer0org1_ccc01_ccaas peer0org2_ccc01_ccaas peer0org3_ccc01_ccaas

# Or use docker-compose
docker-compose -f fabric-samples/test-network/compose/compose-ccc01-ccaas.yaml down
```

## Verification

Check if everything is stopped:
```powershell
docker ps
```

Should show no running containers.

---

**Note:** All documentation files have been updated to use `stop-network` scripts instead of `network.sh down`.
