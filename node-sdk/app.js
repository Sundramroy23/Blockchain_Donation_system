const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes');
const fundRoutes = require('./routes/fundRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const pinataRoutes = require('./routes/pinataRoutes');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/users', userRoutes);
app.use('/api/funds', fundRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/pinata', pinataRoutes);

app.use('/', (req, res) => {
    console.log('Health check endpoint');
    res.status(200).send('Running on http://localhost:5000');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
