import express from 'express';
import { Gateway, Wallets } from 'fabric-network';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());

const ccpPath = path.resolve(__dirname, '..', 'connection-profile.json');
const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

async function getContract(identityLabel = 'appUser') {
    const wallet = await Wallets.newFileSystemWallet(path.join(__dirname, 'wallet'));
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: identityLabel,
        discovery: { enabled: true, asLocalhost: true },
    });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('your-chaincode-name'); // token/fund/user combined or separate chaincodes
    return { contract, gateway, network };
}

// submit transaction (write)
app.post('/api/issueToken', async (req, res) => {
    const { identity, bankId, ownerId, amount } = req.body;
    const { contract, gateway } = await getContract(identity);
    try {
        const result = await contract.submitTransaction('IssueToken', bankId, ownerId, String(amount));
        res.json({ success: true, payload: JSON.parse(result.toString()) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await gateway.disconnect();
    }
});

// evaluate transaction (read)
app.get('/api/tokens/:bankId', async (req, res) => {
    const identity = req.query.identity || 'appUser';
    const bankId = req.params.bankId;
    const { contract, gateway } = await getContract(identity);
    try {
        const result = await contract.evaluateTransaction('GetTokensByBank', bankId);
        res.json(JSON.parse(result.toString()));
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        await gateway.disconnect();
    }
});

// chaincode events -> simple console or push to clients
app.post('/api/listen', async (req, res) => {
    const identity = req.body.identity || 'appUser';
    const { contract } = await getContract(identity);
    await contract.addContractListener('myListener', '.*', (err, event) => {
        if (err) return console.error('Event listener error', err);
        console.log('Chaincode event:', event.eventName, event.payload.toString());
        // forward to clients via WS/SSE
    });
    res.json({ listening: true });
});

app.listen(3000, () => console.log('API listening on :3000'));