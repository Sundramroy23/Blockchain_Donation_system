'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const MAX_TELEMETRY_EVENTS = Number(process.env.METRICS_MAX_EVENTS || 5000);
const txTelemetry = {
  startedAt: new Date().toISOString(),
  events: [],
  totals: {
    attempts: 0,
    success: 0,
    failure: 0,
  },
};

function trimTelemetryBuffer() {
  const overflow = txTelemetry.events.length - MAX_TELEMETRY_EVENTS;
  if (overflow > 0) {
    txTelemetry.events.splice(0, overflow);
  }
}

function recordTelemetryEvent(event) {
  txTelemetry.events.push(event);
  txTelemetry.totals.attempts += 1;

  if (event.success) {
    txTelemetry.totals.success += 1;
  } else {
    txTelemetry.totals.failure += 1;
  }

  trimTelemetryBuffer();
}

function getTelemetrySnapshot() {
  return {
    startedAt: txTelemetry.startedAt,
    totals: { ...txTelemetry.totals },
    events: txTelemetry.events.slice(),
  };
}

function resetTelemetry() {
  txTelemetry.startedAt = new Date().toISOString();
  txTelemetry.events = [];
  txTelemetry.totals = {
    attempts: 0,
    success: 0,
    failure: 0,
  };
}

function formatError(error) {
  if (!error) return 'unknown error';
  const message = String(error.message || error || 'unknown error');
  const code = error.code ? ` code=${error.code}` : '';
  const name = error.name ? ` name=${error.name}` : '';
  return `${message}${code}${name}`;
}

function normalizeLoopbackUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname === 'localhost') {
      parsed.hostname = '127.0.0.1';
      return parsed.toString();
    }
    return rawUrl;
  } catch (_) {
    return rawUrl;
  }
}

function resolveOrgFromMspId(mspId) {
  const normalized = String(mspId || '').trim().toUpperCase();
  if (normalized === 'ORG1MSP' || normalized === 'PLATFORMMSP') return 'Org1';
  if (normalized === 'ORG2MSP' || normalized === 'GOVMSP') return 'Org2';
  if (normalized === 'ORG3MSP' || normalized === 'NGOMSP') return 'Org3';
  return null;
}

async function registerUser(orgID, adminID, userID, userRole) {
  console.log("request body -->", orgID, adminID, userID, userRole);  
  
  try {
    const ccpPath = path.resolve(__dirname, '..', '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', `${orgID}.example.com`.toLowerCase(), `connection-${orgID}.json`.toLowerCase());
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const orgMSP = ccp.organizations[orgID].mspid;

    // Create a new CA client for interacting with the CA.
    const caOrg = ccp.organizations[orgID].certificateAuthorities[0];
    const caInfo = ccp.certificateAuthorities[caOrg];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const caUrl = normalizeLoopbackUrl(caInfo.url);
    const ca = new FabricCAServices(caUrl, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const userIdentity = await wallet.get(userID);
    if (userIdentity) {
      console.log(`An identity for the user ${userID} already exists in the wallet.`);
      return {
        status: false,
        message: `${userID} has already been enrolled.`
      };
    }

    console.log(`An identity for the user ${userID} does not exist so creating one in the wallet.`);

    // Check to see if we've already enrolled the admin user.
    const adminIdentity = await wallet.get(adminID);
    if (!adminIdentity) {
      console.log(`An identity for the admin user ${adminID} does not exist in the wallet.`);
      console.log('Run the enrollAdmin.js application before retrying.');
      return {
        status: false,
        message: `An identity for admin user ${adminID} does not exist in wallet. Enroll admin first.`
      };
    }

    // build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, adminID);

    // Register the user, enroll the user, and import the new identity into the wallet.
    // Different Fabric setups allow either org-level or department-level affiliation.
    const affiliationCandidates = [
      `${orgID.toLowerCase()}.department1`,
      orgID.toLowerCase(),
    ];

    let secret;
    let lastError;
    for (const affiliation of affiliationCandidates) {
      try {
        secret = await ca.register({
          affiliation,
          enrollmentID: userID,
          role: 'client',
          attrs: [
            { name: 'role', value: userRole, ecert: true },
            { name: 'uuid', value: userID, ecert: true },
          ]
        }, adminUser);
        break;
      } catch (error) {
        lastError = error;
        const message = formatError(error);
        console.warn(`CA register failed for ${userID} with affiliation ${affiliation}: ${message}`);
      }
    }

    if (!secret) {
      const message = formatError(lastError);
      throw new Error(`CA register failed for ${userID} across affiliations [${affiliationCandidates.join(', ')}]: ${message}`);
    }
    const enrollment = await ca.enroll({
      enrollmentID: userID,
      enrollmentSecret: secret,
      attr_reqs: [
        { name: 'role', optional: false },
        { name: 'uuid', optional: false },
      ]
    });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: orgMSP,
      type: 'X.509',
    };
    await wallet.put(userID, x509Identity);
    console.log(`Successfully registered and enrolled user ${userID} and imported it into the wallet`);

    return {
      status: true,
      userID: userID,
      role: userRole,
      message: `${userID} registered and enrolled successfully.`,
    };
  } catch (error) {
    const errorMessage = formatError(error);
    console.error(`Failed to register wallet identity ${userID}:`, errorMessage);
    return {
      status: false,
      message: `Wallet enrollment failed for ${userID}: ${errorMessage}`,
    };
  }
}

async function login(userID) {

    const orgID = 'Org1';

    const ccpPath = path.resolve(__dirname, '..', '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', `${orgID}.example.com`.toLowerCase(), `connection-${orgID}.json`.toLowerCase());
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, '..', 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get(userID);
    if (!identity) {
        console.log(`An identity for the user ${userID} does not exist in the wallet`);
        console.log('Run the registerUser.js application before retrying');
        return {
            status: true,
            message: `An identity for the user ${userID} does not exist.`
        };
    } else {
        return {
            status: true,
            userID: userID,           
            message: `User login successful:: ${userID} .`
        };
    }
}

async function getContract(contractName, user) {
  const walletPath = path.join(__dirname, './../wallet');
  const wallet = await Wallets.newFileSystemWallet(walletPath);

  console.log(`Using wallet path: ${walletPath}`, `User: ${user}`);

  const identity = await wallet.get(user);
  if (!identity) {
    throw new Error(`Identity for ${user} not found in wallet. Register first!`);
  }

  const resolvedOrgId = resolveOrgFromMspId(identity.mspId);
  const orgID = resolvedOrgId || 'Org2';

  if (!resolvedOrgId) {
    console.warn(`Unable to map MSP ID "${identity.mspId}" for user "${user}". Falling back to Org2 connection profile.`);
  }

  const ccpPath = path.resolve(
    __dirname,
    '..',
    '..',
    'fabric-samples',
    'test-network',
    'organizations',
    'peerOrganizations',
    `${orgID}.example.com`.toLowerCase(),
    `connection-${orgID}.json`.toLowerCase()
  );

  let ccp;
  try {
    const raw = fs.readFileSync(ccpPath, 'utf8');
    ccp = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to load or parse connection profile at ${ccpPath}: ${err.message}`);
  }

  const gateway = new Gateway();
  await gateway.connect(ccp, {
    wallet,
    identity: user,
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork('mychannel');
  const contract = network.getContract('ccc01', contractName); // "charity" is chaincode name

  return { contract, gateway };
}

async function invokeTransaction(userCert, contractName, func, args = []) {
  const startedAt = Date.now();
  const { contract, gateway } = await getContract(contractName, userCert);
  try {
    const result = await contract.submitTransaction(func, ...args);
    recordTelemetryEvent({
      type: 'invoke',
      userCert,
      contractName,
      func,
      argsCount: Array.isArray(args) ? args.length : 0,
      success: true,
      durationMs: Date.now() - startedAt,
      at: new Date().toISOString(),
    });
    if (result == null) {
      throw new Error(`Chaincode ${contractName}.${func} returned no payload`);
    }
    return Buffer.isBuffer(result) ? result.toString('utf8') : String(result);
  } catch (error) {
    recordTelemetryEvent({
      type: 'invoke',
      userCert,
      contractName,
      func,
      argsCount: Array.isArray(args) ? args.length : 0,
      success: false,
      durationMs: Date.now() - startedAt,
      at: new Date().toISOString(),
      error: String(error && error.message ? error.message : error),
    });
    throw error;
  } finally {
    gateway.disconnect();
  }
}


async function queryTransaction( userCert, contractName, func, args = []) {
  const startedAt = Date.now();
  const { contract, gateway } = await getContract(contractName, userCert);
  try {
    const result = await contract.evaluateTransaction(func, ...args);
    recordTelemetryEvent({
      type: 'query',
      userCert,
      contractName,
      func,
      argsCount: Array.isArray(args) ? args.length : 0,
      success: true,
      durationMs: Date.now() - startedAt,
      at: new Date().toISOString(),
    });
    if (result == null) {
      throw new Error(`Chaincode ${contractName}.${func} returned no payload`);
    }
    return Buffer.isBuffer(result) ? result.toString('utf8') : String(result);
  } catch (error) {
    recordTelemetryEvent({
      type: 'query',
      userCert,
      contractName,
      func,
      argsCount: Array.isArray(args) ? args.length : 0,
      success: false,
      durationMs: Date.now() - startedAt,
      at: new Date().toISOString(),
      error: String(error && error.message ? error.message : error),
    });
    throw error;
  } finally {
    gateway.disconnect();
  }
}


module.exports = {
  invokeTransaction,
  queryTransaction,
  login,
  registerUser,
  getTelemetrySnapshot,
  resetTelemetry,
};