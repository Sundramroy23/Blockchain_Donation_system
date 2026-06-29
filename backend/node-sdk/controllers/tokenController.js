const { invokeTransaction, queryTransaction } = require('../services/fabricService');
const { getDonorByIdentifier } = require('../services/authDb');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const filterLiveOwnerTokens = (tokens, ownerId) =>
  (tokens || []).filter((token) => {
    if (!token || typeof token !== 'object') {
      return false;
    }
    if (String(token.ownerId || '') !== String(ownerId || '')) {
      return false;
    }
    const remaining = token.remainingAmount != null
      ? toNumber(token.remainingAmount)
      : Math.max(toNumber(token.amount) - toNumber(token.spentAmount), 0);
    const status = String(token.status || '');
    return remaining > 0 && status !== 'REDEEMED' && status !== 'DONATED';
  });

async function assertApprovedDonor(identifier) {
  const donor = await getDonorByIdentifier(identifier);
  if (!donor) {
    throw new Error(`Donor ${String(identifier || '').trim() || 'unknown'} not found`);
  }

  const kycStatus = String(donor.kyc_status || 'NOT_SUBMITTED').toUpperCase();
  if (kycStatus !== 'APPROVED') {
    throw new Error(`Donor ${donor.donor_id || identifier} KYC is ${kycStatus}. Approval is required before this action.`);
  }

  return donor;
}

// Issue tokens (BankMSP only)
exports.issueToken = async (req, res) => {
  try {
    const { userCert, bankId, ownerId, amount } = req.body;
    await assertApprovedDonor(ownerId);
    const result = await invokeTransaction(userCert, 'TokenContract', 'IssueToken', [bankId, ownerId, amount]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    const status = /KYC is/i.test(String(error?.message || '')) ? 403 : 500;
    res.status(status).json({ error: error.message });
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
    const message = String(error?.message || error || 'Transfer failed');
    if (message.includes('cannot be transferred in status TRANSFERRED')) {
      return res.status(409).json({
        error: `${message}. This token is already transferred. Use donate/redeem flow for this token, or issue a new token before transfer.`,
      });
    }
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
    const body = req.body || {};
    const userCert = req.query.userCert || body.userCert;
    const bankId = req.query.bankId || body.bankId;
    const result = await queryTransaction(userCert, 'TokenContract', 'GetTokensByBank', [bankId]);
    res.json({ success: true, data: JSON.parse(result) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

exports.getTokensByOwner = async (req, res) => {
  try {
    const body = req.body || {};
    const userCert = req.query.userCert || body.userCert;
    const ownerId = req.query.ownerId || req.query.donorId || body.ownerId || body.donorId;
    const bankId = req.query.bankId || body.bankId;

    try {
      const result = await queryTransaction(userCert, 'TokenContract', 'GetTokensByOwner', [ownerId]);
      res.json({ success: true, data: JSON.parse(result) });
      return;
    } catch (innerError) {
      const message = String(innerError?.message || '');
      const functionMissing = /does not exist: TokenContract:GetTokensByOwner/i.test(message);
      if (!functionMissing) {
        throw innerError;
      }
    }

    const bankIds = [];
    if (bankId) {
      bankIds.push(bankId);
    } else {
      try {
        const banksResult = await queryTransaction(userCert, 'UserContract', 'GetAllBanks', []);
        const banks = JSON.parse(banksResult);
        for (const bank of banks || []) {
          if (bank?.bankId) {
            bankIds.push(bank.bankId);
          }
        }
      } catch (bankLookupError) {
        return res.status(500).json({
          error: `GetTokensByOwner is not available on current chaincode. Redeploy chaincode, or provide bankId and a cert with TokenContract query access. Details: ${bankLookupError.message}`,
        });
      }
    }

    let aggregated = [];
    for (const currentBankId of bankIds) {
      const bankTokensResult = await queryTransaction(userCert, 'TokenContract', 'GetTokensByBank', [currentBankId]);
      const bankTokens = JSON.parse(bankTokensResult);
      aggregated = aggregated.concat(filterLiveOwnerTokens(bankTokens, ownerId));
    }

    res.json({
      success: true,
      fallback: true,
      data: aggregated,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
