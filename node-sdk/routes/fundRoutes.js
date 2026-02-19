const express = require('express');
const router = express.Router();
const fundController = require('../controllers/fundController');

// Create a fund (NGO)
router.post('/', fundController.createFund);
router.get('/', fundController.getAllFunds);
// Get fund details
router.get('/:fundId', fundController.getFund);

// Donate to a fund (Donor)
router.post('/:fundId/donate', fundController.donate);

// Add expense to a fund (NGO)
router.post('/:fundId/expense', fundController.addExpense);

router.get('/:fundId/close', fundController.closeFund);
router.get('/ngo/:ngoId/funds', fundController.getAllFundsByNGO);

router.get('/donor/:donorId/donations', fundController.getAllDonationsByDonor);

module.exports = router;
