const dns = require('dns').promises;
const axios = require('axios');
const validator = require('validator');

// Common high-profile brand keywords frequently targeted in phishing attacks
const BRAND_TARGETS = [
  'paypal', 'google', 'apple', 'microsoft', 'amazon', 'netflix', 'facebook',
  'instagram', 'whatsapp', 'chase', 'wellsfargo', 'bankofamerica', 'citi',
  'binance', 'coinbase', 'metamask', 'dropbox', 'yahoo', 'outlook', 'steam',
  'twitter', 'linkedin', 'ebay', 'adobe', 'spotify', 'tiktok', 'telegram'
];

// Common typo-squatting substitutions
const TYPO_SUBSTITUTIONS = {
  '0': 'o',
  '1': 'l',
  '3': 'e',
  '4': 'a',
  '5': 's',
  'vv': 'w',
  'rn': 'm',
  'cl': 'd'
};

// High-risk and frequently abused TLDs (based on Spamhaus & APWG reports)
const HIGH_RISK_TLDS = new Set([
  'tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'work', 'click', 'loan',
  'buzz', 'fit', 'icu', 'cam', 'rest', 'country', 'surf', 'gdn', 'stream',
  'racing', 'win', 'bid', 'review', 'faith', 'party', 'men', 'kim', 'science',
  'download', 'accountant', 'date', 'trade', 'cricket', 'degree', 'link'
]);

// Phishing & credential-harvesting intent keywords
const SENSITIVE_KEYWORDS = [
  'login', 'signin', 'sign-in', 'log-in', 'verify', 'verification', 'authenticate',
  'credential', 'password', 'recover', 'account-update', 'billing', 'invoice',
  'secure', 'banking', 'wallet', 'unlock', 'confirm', 'suspended', 'urgent',
  'webscr', 'cmd=_login', 'free-gift', 'claim-reward', 'airdrop', 'giveaway'
];

// Well-known legitimate domains for known brands
const LEGITIMATE_BRAND_DOMAINS = {
  paypal: ['paypal.com', 'paypal.me'],
  google: ['google.com', 'accounts.google.com', 'google.co.uk', 'google.co.in'],
  apple: ['apple.com', 'icloud.com'],
  microsoft: ['microsoft.com', 'live.com', 'office.com', 'office365.com', 'azure.com'],
  amazon: ['amazon.com', 'amazon.co.uk', 'amazon.in', 'aws.amazon.com'],
  netflix: ['netflix.com'],
  facebook: ['facebook.com', 'fb.com'],
  instagram: ['instagram.com'],
  whatsapp: ['whatsapp.com'],
  chase: ['chase.com'],
  wellsfargo: ['wellsfargo.com'],
  bankofamerica: ['bankofamerica.com'],
  binance: ['binance.com'],
  coinbase: ['coinbase.com'],
  metamask: ['metamask.io'],
  dropbox: ['dropbox.com'],
  yahoo: ['yahoo.com'],
  outlook: ['outlook.com'],
  steam: ['steampowered.com', 'steamcommunity.com'],
  twitter: ['twitter.com', 'x.com'],
  linkedin: ['linkedin.com'],
  ebay: ['ebay.com'],
  spotify: ['spotify.com'],
  telegram: ['telegram.org', 't.me']
};

// URL Shortener domains that hide final destination
const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'buff.ly', 'ow.ly',
  'rebrand.ly', 'cutt.ly', 'shorte.st', 'trib.al', 'qr.ae', 'tiny.cc'
]);

/**
 * Calculates Shannon entropy of a string (measures randomness / DGA generation)
 */
function calculateEntropy(str) {
  if (!str) return 0;
  const len = str.length;
  const frequencies = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  for (const count of Object.values(frequencies)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(3));
}

/**
 * Normalize and ensure URL has a protocol
 */
function normalizeUrl(inputUrl) {
  let url = inputUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    // If lacks protocol, prepend http:// for parsing
    url = 'http://' + url;
  }
  return url;
}

/**
 * Unshorten / follow redirects for shortened URLs (with timeout and depth limit)
 */
async function expandShortUrl(originalUrl) {
  try {
    const parsed = new URL(originalUrl);
    if (!URL_SHORTENERS.has(parsed.hostname.toLowerCase())) {
      return { isShortened: false, destinationUrl: originalUrl, chain: [originalUrl] };
    }

    const chain = [originalUrl];
    let currentUrl = originalUrl;
    let redirectsCount = 0;

    while (redirectsCount < 3) {
      try {
        const response = await axios.head(currentUrl, {
          maxRedirects: 0,
          timeout: 3000,
          validateStatus: (status) => status >= 200 && status < 400,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        if (response.headers.location) {
          const nextUrl = new URL(response.headers.location, currentUrl).href;
          chain.push(nextUrl);
          currentUrl = nextUrl;
          redirectsCount++;
        } else {
          break;
        }
      } catch (err) {
        if (err.response && err.response.headers && err.response.headers.location) {
          const nextUrl = new URL(err.response.headers.location, currentUrl).href;
          chain.push(nextUrl);
          currentUrl = nextUrl;
          redirectsCount++;
        } else {
          break;
        }
      }
    }

    return {
      isShortened: true,
      destinationUrl: currentUrl,
      chain
    };
  } catch {
    return { isShortened: false, destinationUrl: originalUrl, chain: [originalUrl] };
  }
}

/**
 * Core phishing detection and risk scoring function
 */
async function analyzeUrl(rawUrl) {
  const startTime = Date.now();
  const normalized = normalizeUrl(rawUrl);

  let parsed;
  try {
    parsed = new URL(normalized);
  } catch (err) {
    return {
      isValid: false,
      error: 'Invalid URL format',
      riskScore: 100,
      verdict: 'MALICIOUS',
      verdictText: 'Invalid or Malformed URL',
      flags: [{
        severity: 'CRITICAL',
        title: 'Malformed URL Syntax',
        description: 'The supplied string cannot be parsed as a valid web address.',
        recommendation: 'Do not attempt to open this URL.'
      }]
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const search = parsed.search.toLowerCase();
  const fullHref = parsed.href.toLowerCase();

  const flags = [];
  let riskScore = 0;

  // 1. IP Address as Hostname Check
  const isIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const isIpv6 = /^\[?[a-f0-9:]+\]?$/i.test(hostname) && hostname.includes(':');
  if (isIpv4 || isIpv6) {
    riskScore += 38;
    flags.push({
      severity: 'HIGH',
      category: 'host',
      title: 'Host is a raw IP Address',
      description: `URL uses a raw IP address (${hostname}) instead of a registered domain name. Phishers frequently use raw IPs to bypass domain registration security controls.`,
      recommendation: 'Avoid entering credentials or downloading files from direct IP links.'
    });
  }

  // 2. Punycode / Homograph Attack Check (IDN)
  const isPunycode = hostname.startsWith('xn--') || hostname.includes('.xn--');
  if (isPunycode) {
    riskScore += 35;
    flags.push({
      severity: 'HIGH',
      category: 'homograph',
      title: 'Internationalized Domain Name (Punycode)',
      description: `Domain contains punycode characters (${hostname}), often used in homograph phishing attacks to spoof legitimate brands with lookalike foreign alphabets.`,
      recommendation: 'Inspect decoded characters closely. Legitimate financial and tech services rarely use punycode for main portals.'
    });
  }

  // 3. Userinfo / @ symbol in URL (Credentials deception)
  if (parsed.username || parsed.password || rawUrl.includes('@')) {
    riskScore += 45;
    flags.push({
      severity: 'CRITICAL',
      category: 'obfuscation',
      title: 'Deceptive @ Symbol Detected',
      description: 'The URL contains an "@" symbol. Modern browsers treat text before "@" as username/info, while the browser actually navigates to the host AFTER the "@" symbol.',
      recommendation: 'Do not click! This is an infamous phishing trick designed to fool users into reading the fake domain prefix.'
    });
  }

  // 4. Brand Impersonation & Typo-Squatting Detection
  let impersonatedBrand = null;
  for (const brand of BRAND_TARGETS) {
    const isBrandMentioned = hostname.includes(brand) || fullHref.includes(brand);
    if (isBrandMentioned) {
      // Check if domain is truly legitimate for this brand
      const legitDomains = LEGITIMATE_BRAND_DOMAINS[brand] || [];
      const isLegit = legitDomains.some(legit => hostname === legit || hostname.endsWith('.' + legit));

      if (!isLegit) {
        impersonatedBrand = brand;
        riskScore += 42;
        flags.push({
          severity: 'HIGH',
          category: 'impersonation',
          title: `Potential Brand Impersonation: ${brand.toUpperCase()}`,
          description: `The URL references "${brand}", but the domain "${hostname}" is NOT an official legitimate domain for ${brand}.`,
          recommendation: `Only access ${brand} through their official verified website.`
        });
        break;
      }
    }
  }

  // Check typo-squatting variants (e.g., paypa1, micros0ft, g00gle)
  if (!impersonatedBrand) {
    let normalizedHostname = hostname;
    for (const [digit, char] of Object.entries(TYPO_SUBSTITUTIONS)) {
      normalizedHostname = normalizedHostname.replaceAll(digit, char);
    }
    for (const brand of BRAND_TARGETS) {
      if (normalizedHostname.includes(brand) && !hostname.includes(brand)) {
        riskScore += 35;
        flags.push({
          severity: 'HIGH',
          category: 'typosquatting',
          title: `Typo-squatting / Leetspeak Match: ${brand.toUpperCase()}`,
          description: `Domain "${hostname}" appears to imitate "${brand}" using number/character substitutions.`,
          recommendation: 'Check spelling carefully. This is a common spoofing tactic.'
        });
        break;
      }
    }
  }

  // 5. Suspicious / Abused TLD Check
  const domainParts = hostname.split('.');
  const tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : '';
  if (HIGH_RISK_TLDS.has(tld)) {
    riskScore += 25;
    flags.push({
      severity: 'MEDIUM',
      category: 'tld',
      title: `High-Risk Top-Level Domain (.${tld})`,
      description: `The ".${tld}" top-level domain has a statistically high rate of cybercrime, phishing campaigns, and malware distribution according to threat intel feeds.`,
      recommendation: 'Exercise heightened caution when visiting uncommon or free TLDs.'
    });
  }

  // 6. Subdomain Depth & Excessive Dots
  const dotCountInHost = (hostname.match(/\./g) || []).length;
  if (dotCountInHost >= 4) {
    riskScore += 20;
    flags.push({
      severity: 'MEDIUM',
      category: 'structure',
      title: 'Excessive Subdomain Depth',
      description: `Domain has ${dotCountInHost} dot levels (${hostname}). Phishers often chain subdomains (e.g. "paypal.com.verify.badsite.com") to mislead mobile browser viewports.`,
      recommendation: 'Verify the root domain right before the final suffix.'
    });
  }

  // 7. Excessive Hyphens / Dashes in Hostname
  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount >= 3) {
    riskScore += 18;
    flags.push({
      severity: 'MEDIUM',
      category: 'structure',
      title: 'Suspicious Number of Hyphens',
      description: `Hostname contains ${hyphenCount} hyphens. High hyphen density is a common fingerprint of synthetic phishing domains.`,
      recommendation: 'Review the root domain name.'
    });
  }

  // 8. Sensitive Keywords in Path/Query without Official Domain
  const detectedKeywords = [];
  for (const kw of SENSITIVE_KEYWORDS) {
    if (fullHref.includes(kw)) {
      detectedKeywords.push(kw);
    }
  }

  if (detectedKeywords.length >= 2) {
    riskScore += 25;
    flags.push({
      severity: 'HIGH',
      category: 'keywords',
      title: 'Multiple Phishing Intent Keywords Detected',
      description: `Detected high-sensitivity keywords: [${detectedKeywords.slice(0, 5).join(', ')}]. These are typical triggers for credential harvesting or payment redirection.`,
      recommendation: 'Do NOT submit passwords, bank details, or two-factor codes.'
    });
  } else if (detectedKeywords.length === 1) {
    riskScore += 12;
    flags.push({
      severity: 'LOW',
      category: 'keywords',
      title: `Sensitive Keyword Found: "${detectedKeywords[0]}"`,
      description: `The URL contains authentication/verification keywords (${detectedKeywords[0]}).`,
      recommendation: 'Ensure you initiated this request and trust the domain.'
    });
  }

  // 9. URL Shortener Detection & Redirection
  const isShortener = URL_SHORTENERS.has(hostname);
  let redirectInfo = null;
  if (isShortener) {
    riskScore += 15;
    flags.push({
      severity: 'MEDIUM',
      category: 'shortener',
      title: 'URL Shortening Service Detected',
      description: `The URL uses a shortening service (${hostname}) that conceals the true final destination. QR code quishing attacks frequently use shortened links.`,
      recommendation: 'Inspect the unshortened destination before browsing.'
    });

    // Expand short URL
    redirectInfo = await expandShortUrl(normalized);
    if (redirectInfo.isShortened && redirectInfo.destinationUrl !== normalized) {
      flags.push({
        severity: 'INFO',
        category: 'redirect',
        title: 'Unshortened Destination Resolved',
        description: `Redirects to: ${redirectInfo.destinationUrl}`,
        recommendation: 'Check the unshortened address safety.'
      });
    }
  }

  // 10. Non-Standard Port Check
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    riskScore += 18;
    flags.push({
      severity: 'MEDIUM',
      category: 'port',
      title: `Non-Standard Network Port (:${parsed.port})`,
      description: `The URL specifies a custom communication port :${parsed.port} rather than standard 80 (HTTP) or 443 (HTTPS).`,
      recommendation: 'Legitimate consumer websites rarely run on custom ports.'
    });
  }

  // 11. HTTPS vs Insecure HTTP
  const isHttps = parsed.protocol === 'https:';
  if (!isHttps) {
    riskScore += 15;
    flags.push({
      severity: 'MEDIUM',
      category: 'protocol',
      title: 'Insecure Protocol (HTTP)',
      description: 'The connection is unencrypted (HTTP). Transmitted data like passwords or credit cards can be intercepted via man-in-the-middle attacks.',
      recommendation: 'Never submit confidential credentials on unencrypted HTTP pages.'
    });
  }

  // 12. Shannon Entropy & Randomness Check
  const hostEntropy = calculateEntropy(hostname.split('.')[0] || '');
  if (hostEntropy > 3.8 && hostname.split('.')[0].length > 10) {
    riskScore += 20;
    flags.push({
      severity: 'MEDIUM',
      category: 'entropy',
      title: 'High Domain Name Randomness / Entropy',
      description: `Domain name demonstrates high character entropy (${hostEntropy}), which is characteristic of Domain Generation Algorithms (DGA) used by malware command & control or disposable phishing domains.`,
      recommendation: 'Inspect domain name authenticity.'
    });
  }

  // 13. URL Length Check
  if (normalized.length > 95) {
    riskScore += 10;
    flags.push({
      severity: 'LOW',
      category: 'length',
      title: 'Unusually Long URL Length',
      description: `The URL length is ${normalized.length} characters. Extremely long URLs are frequently used to hide target payloads or push malicious domains outside the visible browser bar.`,
      recommendation: 'Examine complete URL structure.'
    });
  }

  // 14. DNS Resolution & Live Reachability Check
  let dnsResolved = false;
  let resolvedIps = [];
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    dnsResolved = true;
    resolvedIps = addresses.map(a => a.address);
  } catch (dnsErr) {
    dnsResolved = false;
    // If not raw IP and can't resolve, could be a dead/fake/internal domain
    if (!isIpv4 && !isIpv6) {
      riskScore += 10;
      flags.push({
        severity: 'INFO',
        category: 'dns',
        title: 'DNS Resolution Failed or Inactive Domain',
        description: `Could not resolve domain "${hostname}" to an active public IP address. The domain may be non-existent, newly registered, or already taken down.`,
        recommendation: 'Be cautious: phishers often register domains that are swiftly suspended.'
      });
    }
  }

  // Normalize final score between 0 and 100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine Verdict
  let verdict = 'SAFE';
  let verdictText = 'Safe to Browse';

  if (riskScore >= 60) {
    verdict = 'MALICIOUS';
    verdictText = 'High Risk Phishing / Malicious';
  } else if (riskScore >= 25) {
    verdict = 'SUSPICIOUS';
    verdictText = 'Suspicious Indicators Detected';
  } else {
    verdict = 'SAFE';
    verdictText = 'No Major Phishing Indicators Found';
  }

  // If score is safe, provide positive verification notes
  if (riskScore < 25) {
    flags.push({
      severity: 'INFO',
      category: 'trust',
      title: 'Reputable Protocol & Domain Pattern',
      description: isHttps
        ? 'Uses secure encrypted HTTPS communication and follows normal lexical domain rules.'
        : 'Domain follows standard structure.',
      recommendation: 'Always verify certificate validity in your browser address bar.'
    });
  }

  const analysisTimeMs = Date.now() - startTime;

  return {
    isValid: true,
    url: normalized,
    parsed: {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.search,
      port: parsed.port || (isHttps ? '443' : '80'),
      tld
    },
    dns: {
      resolved: dnsResolved,
      ipAddresses: resolvedIps
    },
    metrics: {
      length: normalized.length,
      entropy: hostEntropy,
      subdomainsCount: dotCountInHost,
      isHttps,
      isIpv4,
      isPunycode,
      detectedKeywords
    },
    redirects: redirectInfo,
    riskScore,
    verdict,
    verdictText,
    flags,
    analysisTimeMs,
    scannedAt: new Date().toISOString()
  };
}

module.exports = {
  analyzeUrl,
  calculateEntropy,
  normalizeUrl,
  expandShortUrl
};
