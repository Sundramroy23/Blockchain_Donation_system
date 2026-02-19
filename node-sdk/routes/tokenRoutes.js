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
module.exports = router;
