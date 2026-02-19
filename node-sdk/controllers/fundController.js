const { invokeTransaction, queryTransaction } = require('../services/fabricService');
const { generateBadge } = require('../services/generateBadge');

// Create a new fund (only NGO org)
exports.createFund = async (req, res) => {
  try {
    const { userCert, fundId, ngoId, title, purpose, fundTarget } = req.body;
    const result = await invokeTransaction(userCert, 'FundContract', 'CreateFund', [fundId, ngoId, title, purpose, fundTarget]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Donate to a fund (Donor org)
exports.donate = async (req, res) => {
  try {
    const { userCert, fundId, donorId, tokenId, amount } = req.body;
    
    // generate badge or image logic will go here in future - > cid 
        const cid = await generateBadge({
          name: donorId,
          role: 'Donor',
          amount: amount,
          message: 'Thank you for your donation!',
          qrData: `DonorID:${donorId}|fundId:${fundId}|Amount:${amount}`,
        });

    const result = await invokeTransaction(userCert, 'FundContract', 'Donate', [fundId, donorId, tokenId, amount, cid.ipfsLink]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add expense to a fund (NGO org)
exports.addExpense = async (req, res) => {
  try {
    const { userCert, fundId, description, amount, spenderId } = req.body;
    const result = await invokeTransaction(userCert, 'FundContract', 'AddExpense', [fundId, description, amount, spenderId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get fund details
exports.getFund = async (req, res) => {
  try {
    const { userCert, fundId } = req.body;
    const result = await queryTransaction( userCert, 'FundContract', 'GetFund', [fundId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get all donations by donor
exports.getAllDonationsByDonor = async (req, res) => {
  try {
    const { userCert, donorId } = req.body;
    const result = await queryTransaction(userCert, 'FundContract', 'GetAllDonationsByDonor', [donorId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GetAllFundsByNGO 
exports.getAllFundsByNGO = async (req, res) => {
  try {
    const { userCert, ngoId } = req.body;
    const result = await queryTransaction(userCert, 'FundContract', 'GetAllFundsByNGO', [ngoId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GetAllFunds(ctx)
exports.getAllFunds = async (req, res) => {
  try {
    const { userCert } = req.body;
    const result = await queryTransaction(userCert, 'FundContract', 'GetAllFunds', []);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Close Fund (only NGO org)
exports.closeFund = async (req, res) => {
  try {
    const { userCert, fundId } = req.body;
    const result = await invokeTransaction(userCert, 'FundContract', 'CloseFund', [fundId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};