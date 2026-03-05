const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

// Issue token (Bank)
router.post('/issue', tokenController.issueToken);

// Transfer token
router.post('/transfer', tokenController.transferToken);

// Redeem token (NGO)
router.post('/redeem', tokenController.redeemToken);

router.post('/byBank', tokenController.getTokensByBank);
router.get('/byBank', tokenController.getTokensByBank);
router.post('/byOwner', tokenController.getTokensByOwner);
router.get('/byOwner', tokenController.getTokensByOwner);
router.post('/byDonor', tokenController.getTokensByOwner);
router.get('/byDonor', tokenController.getTokensByOwner);
module.exports = router;
