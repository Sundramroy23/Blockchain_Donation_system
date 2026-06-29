const express = require('express');
const router = express.Router();
const controller = require('../controllers/donorKycController');

router.get('/', controller.list);
router.post('/', controller.submit);
router.post('/submit', controller.submit);
router.get('/:donorId', controller.getByDonor);
router.post('/review', controller.review);

module.exports = router;
