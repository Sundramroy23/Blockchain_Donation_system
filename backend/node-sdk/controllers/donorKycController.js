const donorKycService = require('../services/donorKycService');

async function list(req, res) {
  try {
    const records = await donorKycService.list();
    return res.json({ data: records });
  } catch (err) {
    console.error('donorKyc.list error', err);
    return res.status(500).json({ error: err.message || 'Failed to list donor kyc' });
  }
}

async function getByDonor(req, res) {
  try {
    const donorId = req.params.donorId;
    const records = await donorKycService.getByDonor(donorId);
    return res.json({ data: records });
  } catch (err) {
    console.error('donorKyc.getByDonor error', err);
    return res.status(500).json({ error: err.message || 'Failed to get donor kyc' });
  }
}

async function review(req, res) {
  try {
    const payload = req.body;
    const rec = await donorKycService.review(payload);
    return res.json({ data: rec });
  } catch (err) {
    console.error('donorKyc.review error', err);
    return res.status(500).json({ error: err.message || 'Failed to review donor kyc' });
  }
}

module.exports = { list, getByDonor, review };
