const fetch = require('node-fetch');
const FormData = require('form-data');
require('dotenv').config();
const { generateBadge } = require('../services/generateBadge');

function authHeaders(extra = {}) {
  if (process.env.PINATA_JWT) return { Authorization: `Bearer ${process.env.PINATA_JWT}`, ...extra };
  return { pinata_api_key: process.env.API_KEY, pinata_secret_api_key: process.env.API_SECRET, ...extra };
}

exports.pinJSON = async (req, res) => {
  try {
    const body = {
      pinataOptions: { cidVersion: 1 },
      pinataMetadata: { name: 'test-json' },
      pinataContent: req.body
    };
    const r = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body)
    });
    const json = await r.json();
    res.status(r.ok ? 200 : 500).json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.pinImage = async (req, res) => {
  try {
    // generateBadge currently generates the badge and uploads it to Pinata
    // (and returns ipfs info). If it already uploaded, just return that result
    const result = await generateBadge(req.body);

    if (result && result.ipfsLink) {
      return res.status(200).json({ success: true, ipfsLink: result.ipfsLink, cid: result.ipfsLink.split('/').pop() });
    }

    // Fallback: if generateBadge returned a local filePath, upload that stream
    if (result && result.filePath) {
      const fileStream = fs.createReadStream(result.filePath);
      const form = new FormData();
      form.append('file', fileStream);
      form.append('pinataMetadata', JSON.stringify({ name: 'test-badge' }));

      const r = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: authHeaders(form.getHeaders()),
        body: form
      });
      const json = await r.json();
      return res.status(r.ok ? 200 : 500).json(json);
    }

    // If neither ipfsLink nor filePath present, error
    res.status(500).json({ error: 'Badge generation did not return an upload result' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};