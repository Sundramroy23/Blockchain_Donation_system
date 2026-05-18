'use strict';

const fs = require('fs');
const path = require('path');
const APPROVALS_FILE = path.join(__dirname, '..', 'data', 'approvals.json');

function ensureApprovalsFile() {
  const dir = path.dirname(APPROVALS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(APPROVALS_FILE)) fs.writeFileSync(APPROVALS_FILE, JSON.stringify([], null, 2), 'utf8');
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

function newId(prefix = 'APP') {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// NGO creates an approval request for an expense allowance tied to a fund.
exports.createApproval = async (req, res) => {
  try {
    const { createdBy, fundId, ngoId, amount, note, description } = req.body;
    if (!createdBy || !fundId || !ngoId || amount == null) {
      return res.status(400).json({ error: 'createdBy, fundId, ngoId and amount are required' });
    }

    const requestedAmount = Number(amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({ error: `Invalid amount: ${amount}` });
    }

    let availableBalance = 0;
    try {
      const { queryTransaction } = require('../services/fabricService');
      const fundResult = await queryTransaction(createdBy, 'FundContract', 'GetFund', [fundId]);
      const fund = JSON.parse(fundResult || '{}');
      availableBalance = Number(fund?.totalTokens || fund?.currentAmount || fund?.raised || 0);

      if (fund?.ngoId && String(fund.ngoId).trim() !== String(ngoId).trim()) {
        return res.status(400).json({ error: `Fund ${fundId} belongs to ${fund.ngoId}, not ${ngoId}` });
      }
    } catch (fundError) {
      return res.status(500).json({ error: `Unable to validate fund balance for ${fundId}: ${String(fundError && fundError.message ? fundError.message : fundError)}` });
    }

    if (requestedAmount > availableBalance) {
      return res.status(400).json({
        error: `Insufficient fund balance. Available: ${availableBalance}, requested: ${requestedAmount}`,
      });
    }

    const approvals = readApprovals();
    const approval = {
      approvalId: newId('APP'),
      fundId,
      ngoId,
      amount: requestedAmount,
      approvedAmount: 0,
      redeemedAmount: 0,
      remainingAmount: Number(amount),
      description: description || '',
      note: note || '',
      status: 'PENDING',
      createdBy,
      createdAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      redeemedAt: null,
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
    const { approvalId, adminCert } = req.body;
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
