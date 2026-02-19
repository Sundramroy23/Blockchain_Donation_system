const { invokeTransaction } = require('../services/fabricService');

// Issue tokens (BankMSP only)
exports.issueToken = async (req, res) => {
  try {
    const { userCert, bankId, ownerId, amount } = req.body;
    const result = await invokeTransaction(userCert, 'TokenContract', 'IssueToken', [bankId, ownerId, amount]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Transfer token (Donor -> FundManager)
exports.transferToken = async (req, res) => {
  try {
    const { userCert, tokenId, toId } = req.body;
    console.log("Args:", tokenId, toId);
    const result = await invokeTransaction(userCert, 'TokenContract', 'TransferToken', [tokenId, toId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Redeem token (only NGO)
exports.redeemToken = async (req, res) => {
  try {
    const { userCert, tokenId, ngoId } = req.body;
    const result = await invokeTransaction(userCert, 'TokenContract', 'RedeemToken', [tokenId, ngoId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTokensByBank = async (req, res) => { 
 try {
    const { userCert, bankId } = req.body;
    const result = await invokeTransaction(userCert, 'TokenContract', 'GetTokensByBank', [bankId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
