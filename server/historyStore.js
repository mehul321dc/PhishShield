// In-memory history store with maximum size cap
const MAX_HISTORY_ITEMS = 50;

class HistoryStore {
  constructor() {
    this.history = [];
  }

  addEntry(entry) {
    const item = {
      id: 'scan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      source: entry.source || 'URL', // 'URL' | 'QR Code'
      url: entry.url,
      verdict: entry.verdict,
      riskScore: entry.riskScore,
      verdictText: entry.verdictText,
      flagsCount: (entry.flags || []).length,
      topFlag: entry.flags && entry.flags[0] ? entry.flags[0].title : 'Clean scan',
      details: entry
    };

    this.history.unshift(item);
    if (this.history.length > MAX_HISTORY_ITEMS) {
      this.history.pop();
    }
    return item;
  }

  getAll() {
    return this.history;
  }

  clear() {
    this.history = [];
    return true;
  }

  getStats() {
    const total = this.history.length;
    if (total === 0) {
      return {
        totalScans: 0,
        safeCount: 0,
        suspiciousCount: 0,
        maliciousCount: 0,
        averageRiskScore: 0,
        qrScansCount: 0,
        urlScansCount: 0
      };
    }

    let safeCount = 0;
    let suspiciousCount = 0;
    let maliciousCount = 0;
    let qrScansCount = 0;
    let urlScansCount = 0;
    let totalScore = 0;

    for (const item of this.history) {
      totalScore += item.riskScore;
      if (item.verdict === 'SAFE') safeCount++;
      else if (item.verdict === 'SUSPICIOUS') suspiciousCount++;
      else if (item.verdict === 'MALICIOUS') maliciousCount++;

      if (item.source === 'QR Code') qrScansCount++;
      else urlScansCount++;
    }

    return {
      totalScans: total,
      safeCount,
      suspiciousCount,
      maliciousCount,
      averageRiskScore: Math.round(totalScore / total),
      qrScansCount,
      urlScansCount
    };
  }
}

const historyStore = new HistoryStore();
module.exports = historyStore;
