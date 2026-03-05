const express = require('express');
const router = express.Router();
const pinataController = require('../controllers/pinataController');

router.post('/json', pinataController.pinJSON);
router.post('/image', pinataController.pinImage);

module.exports = router;