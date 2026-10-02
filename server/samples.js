const QRCode = require('qrcode');

const SAMPLE_PRESETS = [
  {
    id: 'sample-safe',
    name: 'Safe: Official Google Portal',
    url: 'https://google.com',
    type: 'Safe',
    description: 'Legitimate HTTPS domain of a globally verified brand.'
  },
  {
    id: 'sample-phish-brand',
    name: 'Phishing: Fake PayPal Login',
    url: 'http://paypal-security-update.account-verification-login.tk/signin',
    type: 'Phishing',
    description: 'Abused .tk TLD, brand impersonation, sensitive keywords, and insecure HTTP.'
  },
  {
    id: 'sample-phish-ip',
    name: 'Phishing: Direct IP Bank Scam',
    url: 'http://192.168.1.100/chase-online/banking/login.php',
    type: 'Phishing',
    description: 'Raw IP address, brand impersonation in path, credential harvesting triggers.'
  },
  {
    id: 'sample-quish-wifi',
    name: 'Quishing: Evil Twin Wi-Fi',
    url: 'WIFI:S:Free_Airport_HighSpeed_WiFi;T:WPA;P:guest12345;;',
    type: 'Suspicious',
    description: 'Rogue Wi-Fi configuration designed to entice users into an unencrypted hotspot.'
  }
];

let cachedSamples = null;

async function getSampleQRs() {
  if (cachedSamples) return cachedSamples;

  const generated = [];
  for (const item of SAMPLE_PRESETS) {
    try {
      const dataUrl = await QRCode.toDataURL(item.url, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 320,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      generated.push({
        ...item,
        dataUrl
      });
    } catch (err) {
      console.error(`Failed to generate sample QR for ${item.id}:`, err);
    }
  }

  cachedSamples = generated;
  return generated;
}

module.exports = {
  getSampleQRs,
  SAMPLE_PRESETS
};
