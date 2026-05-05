require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const credentialRoutes = require('./routes/credentials');
const verifyRoutes = require('./routes/verify');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/verify', verifyRoutes);

// Well-known endpoints
app.get('/.well-known/jwks.json', require('./routes/wellknown').jwks);
app.get('/.well-known/blockchain-registry.json', require('./routes/wellknown').blockchainRegistry);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`KTM Backend running on port ${PORT}`);
  });
}

module.exports = app;
