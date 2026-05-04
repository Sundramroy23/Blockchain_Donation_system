const express = require('express');
const router = express.Router();
const researchController = require('../controllers/researchController');

router.get('/stats', researchController.getStats);
router.get('/stats.csv', researchController.getStatsCsv);
router.get('/stats-paper.csv', researchController.getPaperStatsCsv);
router.post('/stats/reset', researchController.resetStatsWindow);

module.exports = router;
