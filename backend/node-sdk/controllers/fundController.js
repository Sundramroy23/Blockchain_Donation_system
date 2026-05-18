const { invokeTransaction, queryTransaction } = require('../services/fabricService');
const { safeGenerateBadge } = require('../services/badgeService');

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
    const { userCert, donorId, tokenId, amount } = req.body;
    const fundId = req.params.fundId || req.body.fundId;

    if (!userCert || !donorId || !tokenId || amount == null || !fundId) {
      return res.status(400).json({
        error: 'userCert, donorId, tokenId, amount and fundId are required',
      });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: `Invalid amount: ${amount}` });
    }

    const fundResult = await queryTransaction(userCert, 'FundContract', 'GetFund', [fundId]);
    const fund = JSON.parse(fundResult);
    if (!fund?.ngoId) {
      return res.status(400).json({ error: `Fund ${fundId} does not have ngoId` });
    }

    const targetNgoId = String(fund.ngoId || '').trim();
    const tokenListRaw = await queryTransaction(userCert, 'TokenContract', 'GetTokensByOwner', [donorId]);
    const tokenList = JSON.parse(tokenListRaw || '[]');
    const selectedToken = Array.isArray(tokenList) ? tokenList.find((item) => String(item?.tokenId || '') === String(tokenId)) : null;

    if (!selectedToken) {
      return res.status(400).json({ error: `Token ${tokenId} was not found for donor ${donorId}` });
    }

    const tokenStatus = String(selectedToken?.status || '').toUpperCase();
    const tokenToId = String(selectedToken?.toId || '').trim();

    if (tokenStatus === 'DONATED') {
      return res.status(400).json({ error: 'This token is fully donated. Please pick another token.' });
    }

    if (['TRANSFERRED', 'PARTIALLY_DONATED'].includes(tokenStatus)) {
      if (tokenToId && targetNgoId && tokenToId !== targetNgoId) {
        return res.status(400).json({
          error: `Token already transferred to ${tokenToId}. Please pick a token transferred to ${targetNgoId}.`,
        });
      }
    } else {
      const bankServiceIdentity = process.env.BANK_SERVICE_IDENTITY || 'bank001';
      await invokeTransaction(bankServiceIdentity, 'TokenContract', 'TransferToken', [tokenId, targetNgoId]);
    }

    // generate badge or image logic will go here in future - > cid 
        const cid = await safeGenerateBadge({
          name: donorId,
          role: 'Donor',
          amount: amount,
          message: 'Thank you for your donation!',
          qrData: `DonorID:${donorId}|fundId:${fundId}|Amount:${amount}`,
        }, 'donate');

    const result = await invokeTransaction(userCert, 'FundContract', 'Donate', [fundId, donorId, tokenId, String(parsedAmount), cid.ipfsLink || '']);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    const message = String(error && error.message ? error.message : error);
    res.status(500).json({ error: error.message });
  }
};

// One-shot donate workflow: Issue -> Transfer -> Donate
exports.donateOneShot = async (req, res) => {
  try {
    const fundId = req.params.fundId || req.body.fundId;
    const bankUserCert = req.body.userCert || req.body.bankUserCert;
    const donorUserCert = req.body.donorUserCert || bankUserCert;
    const { bankId, donorId, amount, ngoId: requestedNgoId } = req.body;

    if (!fundId || !bankUserCert || !bankId || !donorId || amount == null) {
      return res.status(400).json({ error: 'fundId, userCert(bank cert), bankId, donorId and amount are required' });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: `Invalid amount: ${amount}` });
    }

    const fundResult = await queryTransaction(bankUserCert, 'FundContract', 'GetFund', [fundId]);
    const fund = JSON.parse(fundResult);
    const ngoId = fund.ngoId;

    if (!ngoId) {
      return res.status(400).json({ error: `Fund ${fundId} does not have ngoId` });
    }

    if (requestedNgoId && String(requestedNgoId) !== String(ngoId)) {
      return res.status(400).json({
        error: `ngoId mismatch. Fund ${fundId} belongs to ${ngoId}, but request provided ${requestedNgoId}`,
      });
    }

    const issueResult = await invokeTransaction(bankUserCert, 'TokenContract', 'IssueToken', [bankId, donorId, String(parsedAmount)]);
    const issuedToken = JSON.parse(issueResult);

    const transferResult = await invokeTransaction(bankUserCert, 'TokenContract', 'TransferToken', [issuedToken.tokenId, ngoId]);
    const transferredToken = JSON.parse(transferResult);

    const cid = await safeGenerateBadge({
      name: donorId,
      role: 'Donor',
      amount: parsedAmount,
      message: 'Thank you for your donation!',
      qrData: `DonorID:${donorId}|fundId:${fundId}|Amount:${parsedAmount}`,
    }, 'donateOneShot');

    const donateResult = await invokeTransaction(donorUserCert, 'FundContract', 'Donate', [fundId, donorId, issuedToken.tokenId, String(parsedAmount), cid.ipfsLink || '']);
    const donatedFund = JSON.parse(donateResult);

    res.json({
      success: true,
      data: {
        fundId,
        ngoId,
        issuedToken,
        transferredToken,
        donatedFund,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add expense to a fund (NGO org)
exports.addExpense = async (req, res) => {
  try {
    const { userCert, description, amount, spenderId } = req.body;
    const fundId = req.params.fundId || req.body.fundId;
    const result = await invokeTransaction(userCert, 'FundContract', 'AddExpense', [fundId, description, amount, spenderId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get fund details
exports.getFund = async (req, res) => {
  try {
    const userCert = req.query.userCert || req.body.userCert;
    const fundId = req.params.fundId || req.query.fundId || req.body.fundId;
    const result = await queryTransaction( userCert, 'FundContract', 'GetFund', [fundId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get all donations by donor
exports.getAllDonationsByDonor = async (req, res) => {
  try {
    const userCert = req.query.userCert || req.body.userCert;
    const donorId = req.params.donorId || req.query.donorId || req.body.donorId;
    const result = await queryTransaction(userCert, 'FundContract', 'GetAllDonationsByDonor', [donorId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GetAllFundsByNGO 
exports.getAllFundsByNGO = async (req, res) => {
  try {
    const userCert = req.query.userCert || req.body.userCert;
    const ngoId = req.params.ngoId || req.query.ngoId || req.body.ngoId;
    const result = await queryTransaction(userCert, 'FundContract', 'GetAllFundsByNGO', [ngoId]);
    let parsed = JSON.parse(result || '[]');

    // Filter out non-fund ledger entries sometimes returned by GetAllFundsByNGO
    // Some deployments store NGO or other objects with ngoId; keep only records
    // that look like funds (have a fundId or explicit type === 'FUND')
    if (Array.isArray(parsed)) {
      parsed = parsed.filter((r) => r && (r.fundId || String(r.type || '').toUpperCase() === 'FUND'));
    }

    return res.json({ success: true, data: parsed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GetAllFunds(ctx)
exports.getAllFunds = async (req, res) => {
  try {
    const userCert = req.query.userCert || req.body.userCert;
    const result = await queryTransaction(userCert, 'FundContract', 'GetAllFunds', []);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Close Fund (only NGO org)
exports.closeFund = async (req, res) => {
  try {
    const userCert = req.query.userCert || req.body.userCert;
    const fundId = req.params.fundId || req.query.fundId || req.body.fundId;
    const result = await invokeTransaction(userCert, 'FundContract', 'CloseFund', [fundId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};