const express = require('express');
const multer = require('multer');
const { analyzeUrl } = require('../detector');
const { decodeQrBuffer } = require('../qrDecoder');
const historyStore = require('../historyStore');
const { getSampleQRs } = require('../samples');

const router = express.Router();

// Configure multer for in-memory file uploads (max 10MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, WEBP, etc.) are allowed for QR code scanning.'));
    }
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'URL & QR Phishing Detection Platform API'
  });
});

/**
 * Analyze a URL for phishing and security indicators
 */
router.post('/scan-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid URL string to analyze.'
      });
    }

    const analysis = await analyzeUrl(url.trim());

    // Record into scan history
    historyStore.addEntry({
      source: 'URL',
      url: analysis.url || url,
      verdict: analysis.verdict,
      riskScore: analysis.riskScore,
      verdictText: analysis.verdictText,
      flags: analysis.flags,
      ...analysis
    });

    res.json({
      success: true,
      data: analysis
    });
  } catch (err) {
    console.error('Error scanning URL:', err);
    res.status(500).json({
      success: false,
      error: 'An internal error occurred while analyzing the URL.',
      details: err.message
    });
  }
});

/**
 * Decode and analyze a QR Code image (either via file upload or base64 string)
 */
router.post('/scan-qr', upload.single('qrImage'), async (req, res) => {
  try {
    let imageBuffer = null;

    if (req.file && req.file.buffer) {
      imageBuffer = req.file.buffer;
    } else if (req.body && req.body.imageBase64) {
      // Decode base64 data URI (e.g. data:image/png;base64,...)
      const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    if (!imageBuffer) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a QR code image file or supply a base64 encoded image string.'
      });
    }

    const decodeResult = await decodeQrBuffer(imageBuffer);

    if (!decodeResult.success) {
      return res.status(422).json({
        success: false,
        error: decodeResult.error
      });
    }

    // Record into history
    if (decodeResult.analysis) {
      historyStore.addEntry({
        source: 'QR Code',
        url: decodeResult.qrContent,
        verdict: decodeResult.analysis.verdict,
        riskScore: decodeResult.analysis.riskScore,
        verdictText: decodeResult.analysis.verdictText,
        flags: decodeResult.analysis.flags,
        ...decodeResult.analysis
      });
    }

    res.json({
      success: true,
      data: {
        qrContent: decodeResult.qrContent,
        isUrl: decodeResult.isUrl,
        analysis: decodeResult.analysis
      }
    });
  } catch (err) {
    console.error('Error scanning QR code:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to process QR code image.',
      details: err.message
    });
  }
});

/**
 * Retrieve scan history
 */
router.get('/history', (req, res) => {
  res.json({
    success: true,
    history: historyStore.getAll()
  });
});

/**
 * Clear scan history
 */
router.delete('/history', (req, res) => {
  historyStore.clear();
  res.json({
    success: true,
    message: 'Scan history cleared successfully.'
  });
});

/**
 * Retrieve stats overview
 */
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    stats: historyStore.getStats()
  });
});

/**
 * Get sample test QR codes
 */
router.get('/samples', async (req, res) => {
  try {
    const samples = await getSampleQRs();
    res.json({
      success: true,
      samples
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR samples.'
    });
  }
});

module.exports = router;
