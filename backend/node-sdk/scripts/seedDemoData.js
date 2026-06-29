const { invokeTransaction, queryTransaction, registerUser } = require('../services/fabricService');
const { setNgoEmail } = require('../services/ngoRegistryService');

const GOV_USER_CERT = process.env.SEED_GOV_USER_CERT || 'govUserTom';
const NGO_ADMIN_CERT = process.env.SEED_NGO_ADMIN_CERT || 'ngoAdminUser';
const NGO_USER_CERT = process.env.SEED_NGO_USER_CERT || 'ngoUserSeed';
const TARGET_BANKS = Number(process.env.SEED_BANK_COUNT || 5);
const TARGET_NGOS = Number(process.env.SEED_NGO_COUNT || 50);

const banks = [
  { bankId: 'bank001', name: 'State Bank of India', branch: 'Mumbai Main', ifscCode: 'SBIN0000001' },
  { bankId: 'bank002', name: 'HDFC Bank', branch: 'New Delhi Connaught Place', ifscCode: 'HDFC0000002' },
  { bankId: 'bank003', name: 'ICICI Bank', branch: 'Bengaluru MG Road', ifscCode: 'ICIC0000003' },
  { bankId: 'bank004', name: 'Axis Bank', branch: 'Chennai Anna Salai', ifscCode: 'UTIB0000004' },
  { bankId: 'bank005', name: 'Punjab National Bank', branch: 'Kolkata Park Street', ifscCode: 'PUNB0000005' },
];

const ngoTemplates = [
  'Helping Hands Foundation',
  'Green Earth Trust',
  'Care India Society',
  'Bright Future Initiative',
  'Sahyog Welfare Foundation',
  'Jan Sahayata Mission',
  'Rural Hope Network',
  'Nirmal Seva Sangh',
  'Smile for All Foundation',
  'Children First Trust',
];

const areaTemplates = [
  'Mumbai, Maharashtra',
  'Delhi, NCR',
  'Bengaluru, Karnataka',
  'Hyderabad, Telangana',
  'Chennai, Tamil Nadu',
  'Pune, Maharashtra',
  'Kolkata, West Bengal',
  'Ahmedabad, Gujarat',
  'Jaipur, Rajasthan',
  'Lucknow, Uttar Pradesh',
];

const campaignTopics = [
  'Education Support',
  'Health Outreach',
  'Women Empowerment',
  'Clean Water Access',
  'Child Nutrition',
  'Disaster Relief',
  'Skill Development',
  'Tree Plantation',
  'Rural Livelihoods',
  'Community Care',
];

function pick(valueList, index) {
  return valueList[index % valueList.length];
}

function parseArrayPayload(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function makeNgoPayload(index) {
  const sequence = String(index + 1).padStart(3, '0');
  const name = `${pick(ngoTemplates, index)} ${sequence}`;
  const area = pick(areaTemplates, index);

  return {
    ngoId: `ngo${sequence}`,
    name,
    regNo: `NGO-${sequence}`,
    address: `${100 + index} ${area} Office`,
    contact: `9${String(100000000 + index).slice(-9)}`,
    email: `ngo${sequence}@example.org`,
    description: `${name} works on community support programs in ${area}.`,
  };
}

function makeFundPayload(ngoId, ngoIndex, campaignIndex) {
  const sequence = `${String(ngoIndex + 1).padStart(3, '0')}_${campaignIndex + 1}`;
  const topic = pick(campaignTopics, ngoIndex + campaignIndex);
  const target = 250000 + ((ngoIndex % 5) * 50000) + (campaignIndex * 25000);

  return {
    title: `${topic} Campaign ${sequence}`,
    purpose: `${topic} program for ${ngoId}`,
    fundTarget: target,
  };
}

function makeFundId(ngoId, campaignNumber) {
  return `fund-${String(ngoId || '').trim()}-${String(campaignNumber).padStart(2, '0')}`;
}

function isAlreadyExistsResult(result) {
  const message = String(result?.message || '').toLowerCase();
  return message.includes('already enrolled') || message.includes('already exists') || message.includes('already registered');
}

async function ensureNgoUserIdentity() {
  const result = await registerUser('Org3', 'ngoAdmin', NGO_USER_CERT, 'ngoUser');
  if (result.status !== true && !isAlreadyExistsResult(result)) {
    throw new Error(`Failed to prepare NGO campaign identity ${NGO_USER_CERT}: ${result.message}`);
  }
}

async function ensureBankIdentities() {
  const results = [];
  for (const bank of banks.slice(0, TARGET_BANKS)) {
    const result = await registerUser('Org2', 'govAdmin', bank.bankId, 'bankUser');
    if (result.status !== true && !isAlreadyExistsResult(result)) {
      throw new Error(`Failed to prepare bank identity ${bank.bankId}: ${result.message}`);
    }
    results.push({ bankId: bank.bankId, status: result.status ? 'created' : 'exists' });
  }
  return results;
}

async function ensureNgoIdentities() {
  const results = [];
  for (let index = 0; index < TARGET_NGOS; index += 1) {
    const ngo = makeNgoPayload(index);
    const result = await registerUser('Org3', 'ngoAdmin', ngo.ngoId, 'ngoUser');
    if (result.status !== true && !isAlreadyExistsResult(result)) {
      throw new Error(`Failed to prepare NGO identity ${ngo.ngoId}: ${result.message}`);
    }
    results.push({ ngoId: ngo.ngoId, status: result.status ? 'created' : 'exists' });
  }
  return results;
}

async function ensureBanks() {
  const existingBanksRaw = await queryTransaction(GOV_USER_CERT, 'UserContract', 'GetAllBanks', []);
  const existingIds = new Set(parseArrayPayload(existingBanksRaw).map((bank) => String(bank?.bankId || '').trim()).filter(Boolean));

  const results = [];
  for (const bank of banks.slice(0, TARGET_BANKS)) {
    if (existingIds.has(bank.bankId)) {
      results.push({ bankId: bank.bankId, status: 'exists' });
      continue;
    }

    try {
      await invokeTransaction(GOV_USER_CERT, 'UserContract', 'RegisterBank', [bank.bankId, bank.name, bank.branch, bank.ifscCode, '']);
      results.push({ bankId: bank.bankId, status: 'created' });
    } catch (error) {
      const message = String(error && error.message ? error.message : error);
      if (/already exists/i.test(message)) {
        results.push({ bankId: bank.bankId, status: 'exists' });
        continue;
      }
      throw new Error(`Failed to register ${bank.bankId}: ${message}`);
    }
  }

  return results;
}

async function ensureNgos() {
  const existingNgosRaw = await queryTransaction(GOV_USER_CERT, 'UserContract', 'GetAllNGOs', []);
  const existingIds = new Set(parseArrayPayload(existingNgosRaw).map((ngo) => String(ngo?.ngoId || '').trim()).filter(Boolean));

  const results = [];
  for (let index = 0; index < TARGET_NGOS; index += 1) {
    const ngo = makeNgoPayload(index);
    if (existingIds.has(ngo.ngoId)) {
      results.push({ ngoId: ngo.ngoId, status: 'exists' });
      continue;
    }

    try {
      await invokeTransaction(NGO_ADMIN_CERT, 'UserContract', 'RegisterNGO', [ngo.ngoId, ngo.name, ngo.regNo, ngo.address, ngo.contact, ngo.description, '']);
      setNgoEmail(ngo.ngoId, ngo.email, NGO_ADMIN_CERT);
      results.push({ ngoId: ngo.ngoId, status: 'created' });
    } catch (error) {
      const message = String(error && error.message ? error.message : error);
      if (/already exists/i.test(message)) {
        setNgoEmail(ngo.ngoId, ngo.email, NGO_ADMIN_CERT);
        results.push({ ngoId: ngo.ngoId, status: 'exists' });
        continue;
      }
      throw new Error(`Failed to register ${ngo.ngoId}: ${message}`);
    }
  }

  return results;
}

async function ensureCampaigns(ngoId, ngoIndex) {
  const existingFundsRaw = await queryTransaction(NGO_USER_CERT, 'FundContract', 'GetAllFundsByNGO', [ngoId]);
  const existingFunds = parseArrayPayload(existingFundsRaw);
  const currentCount = existingFunds.filter((fund) => fund && typeof fund === 'object').length;
  const targetCount = 2 + (ngoIndex % 2);
  const missingCount = Math.max(0, targetCount - currentCount);

  const results = [];
  for (let campaignIndex = 0; campaignIndex < missingCount; campaignIndex += 1) {
    const payload = makeFundPayload(ngoId, ngoIndex, currentCount + campaignIndex);
    const fundId = makeFundId(ngoId, currentCount + campaignIndex + 1);

    try {
      await invokeTransaction(NGO_USER_CERT, 'FundContract', 'CreateFund', [fundId, ngoId, payload.title, payload.purpose, String(payload.fundTarget)]);
      results.push({ ngoId, status: 'created', fundId });
    } catch (error) {
      const message = String(error && error.message ? error.message : error);
      if (/already exists/i.test(message)) {
        results.push({ ngoId, status: 'exists', fundId });
        continue;
      }
      throw new Error(`Failed to create campaign for ${ngoId}: ${message}`);
    }
  }

  return results;
}

async function main() {
  await ensureNgoUserIdentity();

  const bankResults = await ensureBanks();
  const bankIdentityResults = await ensureBankIdentities();
  const ngoResults = await ensureNgos();
  const ngoIdentityResults = await ensureNgoIdentities();

  const campaignResults = [];
  for (let index = 0; index < TARGET_NGOS; index += 1) {
    const ngoId = `ngo${String(index + 1).padStart(3, '0')}`;
    const seeded = await ensureCampaigns(ngoId, index);
    campaignResults.push(...seeded);
  }

  const summary = {
    banks: bankResults,
    bankWalletIdentities: bankIdentityResults.length,
    ngosCreatedOrFound: ngoResults.length,
    ngoWalletIdentities: ngoIdentityResults.length,
    campaignsCreated: campaignResults.length,
  };

  console.log(JSON.stringify(summary));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});