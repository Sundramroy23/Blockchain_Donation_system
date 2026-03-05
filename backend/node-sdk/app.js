const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const net = require('net');

const userRoutes = require('./routes/userRoutes');
const fundRoutes = require('./routes/fundRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const pinataRoutes = require('./routes/pinataRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));

app.use('/api/users', userRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/pinata', pinataRoutes);

const EXPLORER_URL = process.env.EXPLORER_URL || 'http://localhost:8081';

const probeExplorer = (rawUrl, timeoutMs = 2500) => new Promise((resolve) => {
    try {
        const parsed = new URL(rawUrl);
        const hostname = parsed.hostname;
        const port = Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80));

        const socket = new net.Socket();
        let settled = false;

        const finalize = (result) => {
            if (settled) return;
            settled = true;
            socket.destroy();
            resolve(result);
        };

        socket.setTimeout(timeoutMs);

        socket.on('connect', () => {
            finalize({ ok: true, reachable: true, statusCode: 200, error: null });
        });

        socket.on('timeout', () => {
            finalize({ ok: false, reachable: false, statusCode: 0, error: 'timeout' });
        });

        socket.on('error', (error) => {
            finalize({ ok: false, reachable: false, statusCode: 0, error: error.message });
        });

        socket.connect(port, hostname);
    } catch (error) {
        resolve({ ok: false, reachable: false, statusCode: 0, error: error.message });
    }
});

app.get('/health', (req, res) => {
    console.log('Health check endpoint');
    res.status(200).send('Running on http://localhost:5000');
});

const explorerHealthHandler = async (req, res) => {
    const result = await probeExplorer(EXPLORER_URL);
    const reachable = Boolean(result.reachable);
    const payload = {
        success: reachable,
        reachable,
        explorerUrl: EXPLORER_URL,
        statusCode: result.statusCode,
        error: result.error || null,
    };

    if (reachable) {
        return res.status(200).json(payload);
    }

    return res.status(503).json(payload);
};

app.get('/health/explorer', explorerHealthHandler);
app.get('/health/explore', explorerHealthHandler);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
