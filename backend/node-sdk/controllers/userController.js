const { invokeTransaction, queryTransaction, registerUser, login } = require('../services/fabricService'); 
const { safeGenerateBadge } = require('../services/badgeService');
const fs = require('fs');
const path = require('path');

const GOV_USERS_FILE = path.join(__dirname, '..', 'data', 'govUsers.json');

const ensureGovUsersFile = () => {
  const dirPath = path.dirname(GOV_USERS_FILE);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  if (!fs.existsSync(GOV_USERS_FILE)) {
    fs.writeFileSync(GOV_USERS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
};

const readGovUsers = () => {
  ensureGovUsersFile();
  const raw = fs.readFileSync(GOV_USERS_FILE, 'utf8');
  const data = JSON.parse(raw || '[]');
  return Array.isArray(data) ? data : [];
};

const writeGovUsers = (items) => {
  ensureGovUsersFile();
  fs.writeFileSync(GOV_USERS_FILE, JSON.stringify(items, null, 2), 'utf8');
};


// Register a donor (any user)
exports.registerDonor = async (req, res) => {
  try {
    const { userCert, donorId, name, email, alias } = req.body;

    // create certficate and store in wallet
    const result1 = await registerUser('Org2', 'govAdmin', donorId, 'donor');
    if (result1.status !== true) {
      return res.status(400).json({ error: result1.message });
    }
     
    // generate badge or image logic will go here in future - > cid 
    const cid = await safeGenerateBadge({
      name,
      role: 'Donor',
      amount: 0,
      message: 'Verified Donor',
      qrData: `DonorID:${donorId}|Name:${name}|Email:${email}|Alias:${alias}`,
    }, 'registerDonor');

    // res.json({ success: true, data: cid });

    const result2 = await invokeTransaction(userCert, 'UserContract', 'RegisterDonor', [donorId, name, email, alias, cid.ipfsLink || '']);
    res.json({ success: true, data: JSON.parse(result2) });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get donor details
exports.getDonor = async (req, res) => {
  try {
    const userCert = req.query.userCert || req.body.userCert;
    const donorId = req.query.donorId || req.body.donorId;
    const result = await queryTransaction(userCert, 'UserContract', 'GetDonor', [donorId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Register NGO (GovMSP only)
exports.registerNGO = async (req, res) => {
  try {
    const { userCert, ngoId, name, regNo, address, contact, description } = req.body;
    
    // create certficate and store in wallet
    const result1 = await registerUser('Org3', 'ngoAdmin', ngoId, 'ngoUser');
    if (result1.status !== true) {
      return res.status(400).json({ error: result1.message });
    }

    // generate badge or image logic will go here in future - > cid 
    const cid = await safeGenerateBadge({
      name,
      role: 'NGO',
      amount: 0,
      message: 'Verified NGO',
      qrData: `NGOID:${ngoId}|Name:${name}|RegNo:${regNo}|Address:${address}|Contact:${contact}|Description:${description}`,
    }, 'registerNGO');

    const result = await invokeTransaction(userCert, 'UserContract', 'RegisterNGO', [ngoId, name, regNo, address, contact, description, cid.ipfsLink || '']);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get NGO details
exports.getNGO = async (req, res) => {
  try {
    const userCert = req.query.userCert || req.body.userCert;
    const ngoId = req.query.ngoId || req.body.ngoId;
    const result = await queryTransaction(userCert, 'UserContract', 'GetNGO', [ngoId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Register Bank (GovMSP only)
exports.registerBank = async (req, res) => {
  try {
    const { userCert, bankId, name, branch, ifscCode } = req.body;

    // create certficate and store in wallet
    const result1 = await registerUser('Org2', 'govAdmin', bankId, 'bankUser');
    if (result1.status !== true) {
      return res.status(400).json({ error: result1.message });
    }
    
    // generate badge or image logic will go here in future - > cid 
    const cid = await safeGenerateBadge({
      name,
      role: 'Bank',
      amount: 0,
      message: 'Verified Bank',
      qrData: `BankID:${bankId}|Name:${name}|Branch:${branch}|IFSC:${ifscCode}`,
    }, 'registerBank');

    const result = await invokeTransaction(userCert, 'UserContract', 'RegisterBank', [bankId, name, branch, ifscCode, cid.ipfsLink || '']);
    res.json({ success: true, data: JSON.parse(result) });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Bank details
exports.getBank = async (req, res) => {
  try {
    const userCert = req.query.userCert || req.body.userCert;
    const bankId = req.query.bankId || req.body.bankId;
    const result = await queryTransaction(userCert, 'UserContract', 'GetBank', [bankId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GetAllBanks(ctx) - call by GovMSP
exports.getAllBanks = async (req, res) => {
  try {
    const userCert = req.query.userCert || req.body.userCert;
    const result = await queryTransaction(userCert, 'UserContract', 'GetAllBanks', []);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  

// GetAllNGOs(ctx) - call by GovMSP
exports.getAllNGOs = async (req, res) => {
  try {
    const userCert = req.query.userCert || req.body.userCert;
    const result = await queryTransaction(userCert, 'UserContract', 'GetAllNGOs', []);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GetAllDonors(ctx) - call by GovMSP
exports.getAllDonors = async (req, res) => {
  try {
    const userCert = req.query.userCert || req.body.userCert;
    const result = await queryTransaction(userCert, 'UserContract', 'GetAllDonors', []);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  

// Register Government User (GovMSP only, API-level registry)
exports.registerGovUser = async (req, res) => {
  try {
    const { userCert, govUserId, name, email, designation } = req.body;

    if (!userCert || !govUserId || !name || !email) {
      return res.status(400).json({ error: 'userCert, govUserId, name and email are required' });
    }

    const existingUsers = readGovUsers();
    const duplicate = existingUsers.find((item) => item.govUserId === govUserId);
    if (duplicate) {
      return res.status(400).json({ error: `${govUserId} already exists` });
    }

    const registerResult = await registerUser('Org2', 'govAdmin', govUserId, 'govUser');
    if (registerResult.status !== true) {
      return res.status(400).json({ error: registerResult.message });
    }

    const govUser = {
      govUserId,
      name,
      email,
      designation: designation || '',
      createdBy: userCert,
      createdAt: new Date().toISOString(),
    };

    existingUsers.push(govUser);
    writeGovUsers(existingUsers);

    res.json({ success: true, data: govUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all Government Users
exports.getAllGovUsers = async (req, res) => {
  try {
    const userCert = req.query.userCert || req.body.userCert;
    if (!userCert) {
      return res.status(400).json({ error: 'userCert is required' });
    }
    const users = readGovUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



