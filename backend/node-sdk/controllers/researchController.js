'use strict';

const {
  buildResearchStats,
  buildResearchStatsCsv,
  buildPaperResearchStatsCsv,
} = require('../services/researchMetricsService');
const { resetTelemetry } = require('../services/fabricService');

exports.getStats = async (req, res) => {
  try {
    const stats = buildResearchStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: String(error && error.message ? error.message : error),
    });
  }
};

exports.resetStatsWindow = async (req, res) => {
  try {
    resetTelemetry();
    const stats = buildResearchStats();
    return res.status(200).json({
      success: true,
      message: 'Telemetry window reset successfully.',
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: String(error && error.message ? error.message : error),
    });
  }
};

exports.getStatsCsv = async (req, res) => {
  try {
    const csv = buildResearchStatsCsv();
    const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="research-stats-${timestamp}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: String(error && error.message ? error.message : error),
    });
  }
};

exports.getPaperStatsCsv = async (req, res) => {
  try {
    const csv = buildPaperResearchStatsCsv();
    const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="research-paper-stats-${timestamp}.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: String(error && error.message ? error.message : error),
    });
  }
};
