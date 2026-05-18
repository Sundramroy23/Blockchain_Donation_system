const express = require('express');
const router = express.Router();
const approvalsController = require('../controllers/approvalsController');

// NGO creates approval request
router.post('/', approvalsController.createApproval);

// Admin lists approvals
router.get('/', approvalsController.listApprovals);

// Admin approves (backend will call TransferToken as bank service account)
router.post('/approve', approvalsController.approveApproval);

// NGO redeems approved allowance
router.post('/redeem', approvalsController.redeemApproval);

// NGO views approvals and totals
router.get('/ngo/:ngoId', approvalsController.ngoApprovals);

module.exports = router;
