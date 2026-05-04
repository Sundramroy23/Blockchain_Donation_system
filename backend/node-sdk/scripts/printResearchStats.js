'use strict';

const axios = require('axios');

const baseUrl = process.env.RESEARCH_API_BASE_URL || 'http://localhost:5000';

async function run() {
  const url = `${baseUrl.replace(/\/$/, '')}/api/research/stats`;
  try {
    const response = await axios.get(url, { timeout: 12000 });
    const payload = response.data && response.data.data ? response.data.data : response.data;

    console.log('=== Research Metrics Snapshot ===');
    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    const message = error && error.response && error.response.data
      ? JSON.stringify(error.response.data)
      : String(error && error.message ? error.message : error);

    console.error(`Failed to fetch research stats from ${url}`);
    console.error(message);
    process.exitCode = 1;
  }
}

run();
