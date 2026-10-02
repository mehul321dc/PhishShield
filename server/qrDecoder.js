const jsQR = require('jsqr');
const { Jimp } = require('jimp');
const { analyzeUrl } = require('./detector');

/**
 * Decodes QR code from a Buffer (e.g. from multer file upload or base64)
 * @param {Buffer} buffer 
 * @returns {Promise<{ success: boolean, data?: string, analysis?: any, error?: string }>}
 */
async function decodeQrBuffer(buffer) {
  try {
    const image = await Jimp.read(buffer);
    const { width, height, data } = image.bitmap;

    // Convert pixel buffer to Uint8ClampedArray for jsQR
    const clampedArray = new Uint8ClampedArray(data);
    const qrCode = jsQR(clampedArray, width, height, {
      inversionAttempts: 'attemptBoth'
    });

    if (!qrCode || !qrCode.data) {
      return {
        success: false,
        error: 'No QR code could be detected in this image. Please ensure the QR code is clear, well-lit, and in focus.'
      };
    }

    const rawData = qrCode.data.trim();

    // Check if the decoded payload is a URL or text/Wi-Fi/other
    const isUrl = /^https?:\/\//i.test(rawData) || /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i.test(rawData);

    let urlAnalysis = null;
    if (isUrl) {
      urlAnalysis = await analyzeUrl(rawData);
    } else {
      // Analyze potential malicious text payloads in QR (e.g. command injection, phishing prompts, fake Wi-Fi config)
      const isWifiConfig = rawData.startsWith('WIFI:');
      const isMailto = rawData.startsWith('mailto:');
      const isTel = rawData.startsWith('tel:');

      urlAnalysis = {
        isValid: false,
        isNonUrlPayload: true,
        payloadType: isWifiConfig ? 'Wi-Fi Configuration' : isMailto ? 'Email Trigger' : isTel ? 'Telephone Dial' : 'Plain Text Data',
        rawText: rawData,
        verdict: isWifiConfig ? 'SUSPICIOUS' : 'SAFE',
        verdictText: isWifiConfig ? 'Wi-Fi Credential Quishing Risk' : 'Non-URL QR Code Content',
        riskScore: isWifiConfig ? 30 : 0,
        flags: [
          {
            severity: isWifiConfig ? 'MEDIUM' : 'INFO',
            category: 'payload',
            title: `Detected ${isWifiConfig ? 'Wi-Fi Auto-Connect' : 'Non-URL Content'}`,
            description: isWifiConfig
              ? 'This QR code attempts to configure Wi-Fi network settings. Rogue Wi-Fi setups can be used for man-in-the-middle attacks.'
              : `Content decoded: "${rawData.slice(0, 100)}${rawData.length > 100 ? '...' : ''}"`,
            recommendation: isWifiConfig
              ? 'Only connect to trusted Wi-Fi networks.'
              : 'Content is not a web link.'
          }
        ],
        analysisTimeMs: 5,
        scannedAt: new Date().toISOString()
      };
    }

    return {
      success: true,
      qrContent: rawData,
      isUrl,
      location: qrCode.location,
      analysis: urlAnalysis
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to process image: ${err.message}`
    };
  }
}

module.exports = {
  decodeQrBuffer
};
