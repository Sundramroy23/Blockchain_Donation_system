'use strict';

const fs = require('fs');
const path = require('path');
const APPROVALS_FILE = path.join(__dirname, '..', 'data', 'approvals.json');
const RECEIPTS_ROOT = path.join(__dirname, '..', 'data', 'approval-receipts');

function ensureApprovalsFile() {
  const dir = path.dirname(APPROVALS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(APPROVALS_FILE)) fs.writeFileSync(APPROVALS_FILE, JSON.stringify([], null, 2), 'utf8');
}

function ensureReceiptDir(approvalId) {
  const approvalDir = path.join(RECEIPTS_ROOT, approvalId);
  if (!fs.existsSync(approvalDir)) {
    fs.mkdirSync(approvalDir, { recursive: true });
  }
  return approvalDir;
}

function getReceiptExtension(mimeType, fileName) {
  const normalizedMime = String(mimeType || '').toLowerCase();
  if (normalizedMime.includes('jpeg') || normalizedMime.includes('jpg')) return 'jpg';
  if (normalizedMime.includes('png')) return 'png';
  if (normalizedMime.includes('gif')) return 'gif';
  if (normalizedMime.includes('webp')) return 'webp';
  if (normalizedMime.includes('bmp')) return 'bmp';
  const fallback = String(fileName || '').toLowerCase();
  const match = fallback.match(/\.(png|jpe?g|gif|webp|bmp)$/i);
  return match ? match[1].replace('jpeg', 'jpg') : 'png';
}

function normalizeReceiptItem(entry, index) {
  if (!entry) return null;

  const candidate = typeof entry === 'string' ? { dataUrl: entry } : entry;
  const rawDataUrl = String(candidate.dataUrl || candidate.data || candidate.base64 || '').trim();
  if (!rawDataUrl) return null;

  const dataUrlMatch = rawDataUrl.match(/^data:([^;]+);base64,(.+)$/i);
  const mimeType = String(candidate.mimeType || candidate.type || (dataUrlMatch ? dataUrlMatch[1] : 'image/png')).trim() || 'image/png';
  const base64Data = dataUrlMatch ? dataUrlMatch[2] : rawDataUrl.replace(/^data:[^;]+;base64,/i, '');
  const fileNameSource = String(candidate.name || candidate.fileName || `receipt-${index + 1}`).trim() || `receipt-${index + 1}`;
  const safeName = fileNameSource.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || `receipt-${index + 1}`;

  return {
    mimeType,
    base64Data,
    fileName: safeName,
  };
}

function saveReceiptImages(approvalId, ngoId, receiptImages) {
  const normalizedReceipts = Array.isArray(receiptImages) ? receiptImages : [];
  if (normalizedReceipts.length === 0) return [];

  const approvalDir = ensureReceiptDir(approvalId);
  return normalizedReceipts
    .map((entry, index) => {
      const normalized = normalizeReceiptItem(entry, index);
      if (!normalized) return null;

      const extension = getReceiptExtension(normalized.mimeType, normalized.fileName);
      const fileName = `${approvalId}-${index + 1}.${extension}`;
      const filePath = path.join(approvalDir, fileName);
      const buffer = Buffer.from(normalized.base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);

      return {
        receiptId: `${approvalId}_${index + 1}`,
        fileName,
        fileUrl: `/local-storage/${encodeURIComponent(approvalId)}/${encodeURIComponent(fileName)}`,
        mimeType: normalized.mimeType,
        uploadedAt: new Date().toISOString(),
        ngoId,
      };
    })
    .filter(Boolean);
}

function readApprovals() {
  try {
    ensureApprovalsFile();
    const raw = fs.readFileSync(APPROVALS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeApprovals(list) {
  ensureApprovalsFile();
  fs.writeFileSync(APPROVALS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function buildNgoView(ngoId, approvalsList) {
  const normalizedNgoId = String(ngoId || '').trim().toLowerCase();
  const approvals = (approvalsList || readApprovals()).filter((a) => {
    const approvalNgo = String(a?.ngoId || '').trim().toLowerCase();
    const createdBy = String(a?.createdBy || '').trim().toLowerCase();
    return approvalNgo === normalizedNgoId || createdBy === normalizedNgoId;
  });
  const approved = approvals.filter((a) => a.status === 'APPROVED' || a.status === 'REDEEMED');
  const pending = approvals.filter((a) => a.status === 'PENDING');
  const failed = approvals.filter((a) => a.status === 'FAILED');

  const requestedAmount = approvals.reduce((s, a) => s + Number(a.amount || 0), 0);
  const approvedAmount = approved.reduce((s, a) => s + Number(a.approvedAmount || a.amount || 0), 0);
  const redeemedAmount = approved.reduce((s, a) => s + Number(a.redeemedAmount || 0), 0);
  const remainingAmount = approved.reduce((s, a) => s + Number(a.remainingAmount || 0), 0);
  const pendingAmount = pending.reduce((s, a) => s + Number(a.amount || 0), 0);

  return {
    ngoId,
    approvals,
    totals: {
      requestedAmount,
      approvedCount: approved.length,
      approvedAmount,
      redeemedAmount,
      remainingAmount,
      pendingCount: pending.length,
      pendingAmount,
      failedCount: failed.length,
    },
  };
}

function toNumberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sumAmountList(list) {
  if (!Array.isArray(list)) return null;
  return list.reduce((sum, item) => {
    const amount = Number(item && item.amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
}

function resolveFundAvailableBalance(fund) {
  const directCandidates = [
    toNumberOrNull(fund && fund.totalTokens),
    toNumberOrNull(fund && fund.currentAmount),
    toNumberOrNull(fund && fund.availableBalance),
    toNumberOrNull(fund && fund.balance),
  ].filter((value) => value != null && value >= 0);

  const donationsTotal = sumAmountList(fund && fund.donations);
  const expensesTotal = sumAmountList(fund && fund.expenses);
  const derivedFromEntries = donationsTotal != null
    ? Math.max(0, donationsTotal - (expensesTotal || 0))
    : null;

  const positive = directCandidates.filter((value) => value > 0);
  if (positive.length > 0) {
    return Math.max(...positive);
  }

  if (derivedFromEntries != null && derivedFromEntries > 0) {
    return derivedFromEntries;
  }

  return 0;
}

function resolveTokenRemainingAmount(token) {
  const direct = toNumberOrNull(token && token.remainingAmount);
  if (direct != null) return Math.max(0, direct);
  const total = toNumberOrNull(token && (token.totalAmount != null ? token.totalAmount : token.amount));
  const spent = toNumberOrNull(token && token.spentAmount);
  if (total != null) {
    return Math.max(0, total - (spent || 0));
  }
  return 0;
}

function belongsToNgoHolder(token, ngoId) {
  const normalizedNgoId = String(ngoId || '').trim();
  const toId = String(token && token.toId || '').trim();
  const currentHolderId = String(token && token.currentHolderId || '').trim();
  return normalizedNgoId && (toId === normalizedNgoId || currentHolderId === normalizedNgoId);
}

async function resolveNgoTransferredTokenBalance(queryTransaction, userCert, ngoId) {
  if (!ngoId) return 0;

  let banks = [];
  try {
    const banksRaw = await queryTransaction(userCert, 'UserContract', 'GetAllBanks', []);
    const parsedBanks = JSON.parse(banksRaw || '[]');
    banks = Array.isArray(parsedBanks) ? parsedBanks : [];
  } catch (_) {
    return 0;
  }

  let total = 0;
  for (const bank of banks) {
    const bankId = String(bank && bank.bankId || '').trim();
    if (!bankId) continue;

    try {
      const tokensRaw = await queryTransaction(userCert, 'TokenContract', 'GetTokensByBank', [bankId]);
      const tokens = JSON.parse(tokensRaw || '[]');
      if (!Array.isArray(tokens)) continue;

      for (const token of tokens) {
        if (!token || typeof token !== 'object') continue;

        const status = String(token.status || '').toUpperCase();
        if (status === 'REDEEMED') continue;
        if (!belongsToNgoHolder(token, ngoId)) continue;

        total += resolveTokenRemainingAmount(token);
      }
    } catch (_) {
      // Ignore per-bank query failures so one broken bank record does not block approvals.
    }
  }

  return total;
}

function newId(prefix = 'APP') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// NGO creates an approval request for an expense allowance tied to a fund.
exports.createApproval = async (req, res) => {
  try {
    const { createdBy, fundId, ngoId, amount, note, description, receiptImages } = req.body;
    if (!createdBy || !fundId || !ngoId || amount == null) {
      return res.status(400).json({ error: 'createdBy, fundId, ngoId and amount are required' });
    }

    const requestedAmount = Number(amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ error: `Invalid amount: ${amount}` });
    }

    let availableBalance = 0;
    let fundAvailableBalance = 0;
    let ngoTokenAvailableBalance = 0;
    try {
      const { queryTransaction } = require('../services/fabricService');
      const fundResult = await queryTransaction(createdBy, 'FundContract', 'GetFund', [fundId]);
      const fund = JSON.parse(fundResult || '{}');
      fundAvailableBalance = resolveFundAvailableBalance(fund);

      if (fund?.ngoId && String(fund.ngoId).trim() !== String(ngoId).trim()) {
        return res.status(400).json({ error: `Fund ${fundId} belongs to ${fund.ngoId}, not ${ngoId}` });
      }

      ngoTokenAvailableBalance = await resolveNgoTransferredTokenBalance(queryTransaction, createdBy, ngoId);
      availableBalance = Math.max(fundAvailableBalance, ngoTokenAvailableBalance);
    } catch (fundError) {
      return res.status(500).json({ error: `Unable to validate fund balance for ${fundId}: ${String(fundError && fundError.message ? fundError.message : fundError)}` });
    }

    if (requestedAmount > availableBalance) {
      return res.status(400).json({
        error: `Insufficient fund balance. Available: ${availableBalance}, requested: ${requestedAmount}`,
        details: {
          fundAvailableBalance,
          ngoTokenAvailableBalance,
          fundId,
          ngoId,
        },
      });
    }

    const approvals = readApprovals();
    const approvalId = newId('APP');
    const receipts = saveReceiptImages(approvalId, ngoId, receiptImages);
    const approval = {
      approvalId,
      fundId,
      ngoId,
      amount: requestedAmount,
      approvedAmount: 0,
      redeemedAmount: 0,
      remainingAmount: requestedAmount,
      description: description || '',
      note: note || '',
      status: 'PENDING',
      createdBy,
      createdAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      redeemedAt: null,
      verifiedBy: null,
      verifiedAt: null,
      verificationNote: '',
      receiptCount: receipts.length,
      receipts,
    };

    approvals.push(approval);
    writeApprovals(approvals);

    res.json({ success: true, data: approval });
  } catch (error) {
    res.status(500).json({ error: String(error && error.message ? error.message : error) });
  }
};

// Admin lists all approvals (optionally filter by status)
exports.listApprovals = async (req, res) => {
  try {
    const { status } = req.query;
    const approvals = readApprovals();
    const filtered = status ? approvals.filter((a) => String(a.status).toUpperCase() === String(status).toUpperCase()) : approvals;
    res.json({ success: true, data: filtered });
  } catch (error) {
    res.status(500).json({ error: String(error && error.message ? error.message : error) });
  }
};

// Approve an approval request (admin) and make the amount redeemable by the NGO.
exports.approveApproval = async (req, res) => {
  try {
    const { approvalId, adminCert, verificationNote } = req.body;
    if (!approvalId || !adminCert) {
      return res.status(400).json({ error: 'approvalId and adminCert are required' });
    }

    const approvals = readApprovals();
    const idx = approvals.findIndex((a) => a.approvalId === approvalId);
    if (idx === -1) return res.status(404).json({ error: 'approval not found' });

    const approval = approvals[idx];
    if (approval.status !== 'PENDING') return res.status(400).json({ error: `approval is ${approval.status}` });

    approval.status = 'APPROVED';
    approval.approvedBy = adminCert;
    approval.approvedAt = new Date().toISOString();
    approval.verifiedBy = adminCert;
    approval.verifiedAt = approval.approvedAt;
    approval.verificationNote = String(verificationNote || '').trim();
    approval.approvedAmount = Number(approval.amount || 0);
    approval.remainingAmount = Math.max(0, Number(approval.approvedAmount) - Number(approval.redeemedAmount || 0));

    approvals[idx] = approval;
    writeApprovals(approvals);

    // return updated NGO view so clients can refresh UI immediately
    const ngoView = buildNgoView(approval.ngoId, approvals);
    return res.json({ success: true, data: approval, ngoView });
  } catch (error) {
    res.status(500).json({ error: String(error && error.message ? error.message : error) });
  }
};

// Redeem approved amount from an approved approval record.
exports.redeemApproval = async (req, res) => {
  try {
    const { approvalId, ngoId, amount } = req.body;
    if (!approvalId || !ngoId || amount == null) {
      return res.status(400).json({ error: 'approvalId, ngoId and amount are required' });
    }

    const requestedAmount = Number(amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ error: `Invalid amount: ${amount}` });
    }

    const approvals = readApprovals();
    const idx = approvals.findIndex((a) => a.approvalId === approvalId);
    if (idx === -1) return res.status(404).json({ error: 'approval not found' });

    const approval = approvals[idx];
    if (approval.ngoId !== ngoId) {
      return res.status(403).json({ error: 'approval does not belong to this NGO' });
    }
    if (approval.status !== 'APPROVED') {
      return res.status(400).json({ error: `approval is ${approval.status}` });
    }

    const remaining = Number(approval.remainingAmount || 0);
    if (requestedAmount > remaining) {
      return res.status(400).json({ error: `Insufficient approved amount. Available: ${remaining}, requested: ${requestedAmount}` });
    }

    approval.redeemedAmount = Number(approval.redeemedAmount || 0) + requestedAmount;
    approval.remainingAmount = Math.max(0, Number(approval.approvedAmount || approval.amount || 0) - approval.redeemedAmount);
    approval.redeemedAt = new Date().toISOString();
    if (approval.remainingAmount === 0) {
      approval.status = 'REDEEMED';
    }

    approvals[idx] = approval;
    writeApprovals(approvals);

    // return updated NGO view so clients can refresh UI immediately
    const ngoView = buildNgoView(approval.ngoId, approvals);
    return res.json({ success: true, data: approval, ngoView });
  } catch (error) {
    res.status(500).json({ error: String(error && error.message ? error.message : error) });
  }
};

// NGO view: approvals for their ngoId and summary of approved amount
exports.ngoApprovals = async (req, res) => {
  try {
    const ngoId = req.params.ngoId || req.query.ngoId || (req.body && req.body.ngoId);
    if (!ngoId) return res.status(400).json({ error: 'ngoId is required' });

    const data = buildNgoView(ngoId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: String(error && error.message ? error.message : error) });
  }
};
