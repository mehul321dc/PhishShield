const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for frontend development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers with large limit for image base64 uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Mount API routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🛡️ URL Phishing & Quishing Detection Engine API is running',
    version: '1.0.0',
    documentation: {
      scanUrl: 'POST /api/scan-url',
      scanQr: 'POST /api/scan-qr',
      history: 'GET /api/history',
      stats: 'GET /api/stats',
      samples: 'GET /api/samples'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🛡️  URL Phishing Detection Server running on port ${PORT}`);
  console.log(`🔗  API Base URL: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});
