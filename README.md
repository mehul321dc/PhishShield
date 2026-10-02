# 🛡️ PhishShield AI &bull; URL Phishing & Quishing Detection Platform

A full-stack cybersecurity web platform built with **React** and **Node.js** that inspects web links and decodes QR codes to detect phishing attacks, credential harvesting traps, brand spoofing, and malicious quishing campaigns.

---

## 🌟 Key Features

### 1. 🌐 Real-Time URL Phishing Detector
- **Brand Impersonation & Typo-Squatting Detection**: Identifies imitation attempts on major brands (*PayPal, Google, Apple, Microsoft, Amazon, Netflix, Chase, Binance, etc.*) using leetspeak/character substitution (e.g. `paypa1.com`, `g00gle.com`).
- **Punycode / Homograph Attack Detection**: Catches Internationalized Domain Names (IDNs) using foreign alphabets (e.g., Cyrillic lookalikes) to spoof legitimate URLs.
- **Direct IP Address Detection**: Detects links attempting to bypass domain security via raw IPv4/IPv6 addresses (`http://192.168.1.100/...`).
- **Credential Deception (@ Trick)**: Flags deceptive `@` user-info syntax (`http://google.com@attacker.com`).
- **High-Risk & Abused TLDs**: Flags domains using frequently abused top-level domains (`.tk`, `.ml`, `.xyz`, `.top`, `.click`, `.buzz`, `.loan`).
- **Lexical & Shannon Entropy Analysis**: Identifies randomly generated domains (DGA fingerprints) and excessive subdomain chaining (`paypal.com.verify.attacker.site`).
- **Shortened URL Expansion**: Follows redirect chains for shortened links (`bit.ly`, `tinyurl.com`, `t.co`) to reveal hidden destinations.
- **Live DNS Resolution**: Checks domain existence and active DNS routing in real time.
- **Threat Scoring Gauge**: Calculates a granular threat risk score (0 to 100) categorized into **SAFE**, **SUSPICIOUS**, and **MALICIOUS / PHISHING**.

### 2. 📷 QR Code (Quishing) Threat Scanner
- **File Upload & Drag-and-Drop**: Upload QR code images (`.png`, `.jpg`, `.svg`, `.webp`) for automatic optical decoding and security evaluation.
- **Live WebCam / Camera Scanner**: Scan physical QR codes using your device's camera stream with a real-time targeting viewfinder.
- **Built-in Sample QR Codes**: One-click test cards (Safe Google, Phishing PayPal, Direct IP scam, Wi-Fi quishing) to test the scanner immediately without requiring an external smartphone.
- **Quishing Defense**: Detects malicious Wi-Fi credentials, mailto triggers, and shortened links concealed inside QR barcodes.

### 3. 📜 Scan History & Threat Telemetry
- Real-time logging of all inspected URLs and QR codes.
- Searchable and filterable by threat level (*Safe*, *Suspicious*, *Threats*, *QR Only*).
- One-click detailed forensic inspection modal.
- Export scan logs to structured JSON files.
- Live statistics bar tracking total scans, threats blocked, and QR scans.

### 4. 📚 Threat Intelligence & Educational Guide
- Interactive breakdowns of Quishing mechanics and why cybercriminals use QR codes to bypass enterprise email gateways.
- 8 critical red flags to check before clicking or scanning unknown links.

---

## 🏗️ Architecture & Tech Stack

```text
URL Detector/
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx       # Header with live engine status & stats
│   │   │   ├── UrlScanner.jsx   # URL inspection interface with test presets
│   │   │   ├── QrScanner.jsx    # QR upload, live webcam scan & sample testing
│   │   │   ├── ScanResult.jsx   # Comprehensive security diagnosis & badges
│   │   │   ├── HistoryList.jsx  # Audit history, search, filter & export
│   │   │   └── ThreatIntel.jsx  # Quishing & phishing educational guide
│   │   ├── App.jsx              # Main dashboard container & metrics
│   │   └── index.css            # Tailwind CSS v4 styling & cyber glow theme
│   ├── package.json
│   └── vite.config.js          # Vite configuration with API proxy to port 5001
│
├── server/                     # Backend API (Node.js + Express)
│   ├── detector.js             # Core heuristic URL phishing detection engine
│   ├── qrDecoder.js            # QR image processing (Jimp + jsQR)
│   ├── samples.js              # Sample QR code generator for testing
│   ├── historyStore.js         # Scan history & telemetry store
│   ├── routes/
│   │   └── api.js              # Express REST API endpoints
│   ├── index.js                # Express entry point (Port 5001)
│   └── package.json
│
├── package.json                # Root package with unified dev/start scripts
└── README.md
```

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React Icons, Canvas Confetti, jsQR
- **Backend**: Node.js, Express, Jimp, jsQR, QRCode, Axios, Validator, Multer

---

## 🚀 Getting Started

### 1. Open in VS Code
Open the project folder directly in VS Code:
```bash
code "/Users/mehulverma123/URL Detector"
```

### 2. Start Both Backend & Frontend Concurrently
From the root `URL Detector` directory, run:
```bash
npm run dev
```

This single command starts:
- **Backend API**: `http://localhost:5001`
- **React Frontend**: `http://localhost:5173`

Open `http://localhost:5173` in your browser!

---

## 🧪 Testing Presets

| Type | Test URL / Sample | Expected Verdict |
| :--- | :--- | :--- |
| **Safe** | `https://google.com` | ✅ **SAFE** (Threat Score: 0) |
| **Safe** | `https://github.com` | ✅ **SAFE** (Threat Score: 0) |
| **Phishing** | `http://paypal-security-update.account-verification-login.tk/signin` | 🚨 **MALICIOUS** (Threat Score: 100) |
| **Phishing** | `http://192.168.1.100/chase-online/banking/login.php` | 🚨 **MALICIOUS** (Threat Score: 70+) |
| **Suspicious** | `http://free-crypto-giveaway-airdrop.xyz/claim-reward` | ⚠️ **SUSPICIOUS** (Threat Score: 40+) |

*In the QR Scanner tab, you can also click on the built-in sample cards to test QR code scanning instantly!*

---

## 📡 REST API Endpoints

- `POST /api/scan-url` - Analyzes a URL string for phishing threats (`{ "url": "https://..." }`)
- `POST /api/scan-qr` - Decodes and scans QR images via multipart file upload (`qrImage`) or base64 (`{ "imageBase64": "..." }`)
- `GET /api/history` - Fetches recent scan audit records
- `DELETE /api/history` - Clears scan history
- `GET /api/stats` - Fetches platform telemetry and threat counters
- `GET /api/samples` - Retrieves pre-generated sample QR codes
- `GET /api/health` - API server health status
