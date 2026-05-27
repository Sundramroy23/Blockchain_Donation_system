const express = require('express');
const router = express.Router();
const controller = require('../controllers/donorKycController');

router.get('/', controller.list);
router.get('/:donorId', controller.getByDonor);
router.post('/review', controller.review);

module.exports = router;
