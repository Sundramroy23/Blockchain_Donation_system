const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.all('/clear-local-state', adminController.clearLocalState);

module.exports = router;
