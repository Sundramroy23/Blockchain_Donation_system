const { invokeTransaction, queryTransaction, registerUser, login } = require('../services/fabricService'); 
const { generateBadge } = require('../services/generateBadge');


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
    const cid = await generateBadge({
      name,
      role: 'Donor',
      amount: 0,
      message: 'Verified Donor',
      qrData: `DonorID:${donorId}|Name:${name}|Email:${email}|Alias:${alias}`,
    });

    // res.json({ success: true, data: cid });

    const result2 = await invokeTransaction(userCert, 'UserContract', 'RegisterDonor', [donorId, name, email, alias, cid.ipfsLink]);
    res.json({ success: true, data: JSON.parse(result2) });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get donor details
exports.getDonor = async (req, res) => {
  try {
    const { userCert, donorId } = req.body;
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
    const cid = await generateBadge({
      name,
      role: 'NGO',
      amount: 0,
      message: 'Verified NGO',
      qrData: `NGOID:${ngoId}|Name:${name}|RegNo:${regNo}|Address:${address}|Contact:${contact}|Description:${description}`,
    });

    const result = await invokeTransaction(userCert, 'UserContract', 'RegisterNGO', [ngoId, name, regNo, address, contact, description, cid.ipfsLink]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get NGO details
exports.getNGO = async (req, res) => {
  try {
    const { userCert, ngoId } = req.body;
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
    const cid = await generateBadge({
      name,
      role: 'Bank',
      amount: 0,
      message: 'Verified Bank',
      qrData: `BankID:${bankId}|Name:${name}|Branch:${branch}|IFSC:${ifscCode}`,
    });

    const result = await invokeTransaction(userCert, 'UserContract', 'RegisterBank', [bankId, name, branch, ifscCode, cid.ipfsLink]);
    res.json({ success: true, data: JSON.parse(result) });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Bank details
exports.getBank = async (req, res) => {
  try {
    const { userCert, bankId } = req.body;
    const result = await queryTransaction(userCert, 'UserContract', 'GetBank', [bankId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GetAllBanks(ctx) - call by GovMSP
exports.getAllBanks = async (req, res) => {
  try {
    const { userCert } = req.body;
    const result = await queryTransaction(userCert, 'UserContract', 'GetAllBanks', []);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  

// GetAllNGOs(ctx) - call by GovMSP
exports.getAllNGOs = async (req, res) => {
  try {
    const { userCert } = req.body;
    const result = await queryTransaction(userCert, 'UserContract', 'GetAllNGOs', []);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GetAllDonors(ctx) - call by GovMSP
exports.getAllDonors = async (req, res) => {
  try {
    const { userCert } = req.body;
    const result = await queryTransaction(userCert, 'UserContract', 'GetAllDonors', []);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  



