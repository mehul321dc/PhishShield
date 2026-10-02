import React, { useState, useEffect } from 'react';
import {
  Clock,
  Trash2,
  Download,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  QrCode,
  Globe,
  ExternalLink,
  Search,
  Eye,
  X
} from 'lucide-react';
import ScanResult from './ScanResult';

export default function HistoryList({ onScanUpdated }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'QR'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [onScanUpdated]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/history');
      const json = await res.json();
      if (json.success) {
        setHistory(json.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all scan history logs?')) {
      return;
    }

    try {
      const res = await fetch('/api/history', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setHistory([]);
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `phishing_scan_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredHistory = history.filter((item) => {
    const matchesFilter =
      filter === 'ALL'
        ? true
        : filter === 'QR'
        ? item.source === 'QR Code'
        : item.verdict === filter;

    const matchesSearch =
      !searchQuery ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.topFlag && item.topFlag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header with actions and filters */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-cyan-400" />
            <span>Inspection History & Audit Logs</span>
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-0.5">
            Log of previously analyzed URLs and Quishing QR codes ({history.length} records).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportJson}
            disabled={history.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download JSON Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Logs</span>
          </button>

          <button
            onClick={handleClearHistory}
            disabled={history.length === 0}
            className="px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900/80 border border-red-800/50 disabled:opacity-40 disabled:pointer-events-none text-red-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Clear all records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in history (url, domain, flag)..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-mono">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'SAFE', label: 'Safe' },
            { id: 'SUSPICIOUS', label: 'Suspicious' },
            { id: 'MALICIOUS', label: 'Threats' },
            { id: 'QR', label: 'QR Only' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                filter === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* History Items List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-sm">
          Loading audit logs...
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 space-y-2">
          <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <h3 className="text-white font-semibold">No Scan Records Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || filter !== 'ALL'
              ? 'Try changing your search query or filter settings.'
              : 'Scan a URL or QR code above to build your inspection audit trail.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredHistory.map((item) => {
            const isSafe = item.verdict === 'SAFE';
            const isSuspicious = item.verdict === 'SUSPICIOUS';
            const isMalicious = item.verdict === 'MALICIOUS';

            const badgeColor = isSafe
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
              : isSuspicious
              ? 'bg-amber-950/60 text-amber-400 border-amber-800/40'
              : 'bg-red-950/60 text-red-400 border-red-800/40';

            const BadgeIcon = isSafe
              ? ShieldCheck
              : isSuspicious
              ? AlertTriangle
              : ShieldAlert;

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${badgeColor}`}>
                    <BadgeIcon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.source}
                      </span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${badgeColor}`}>
                        {item.verdict}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="font-mono text-sm text-white truncate" title={item.url}>
                      {item.url}
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {item.topFlag || 'Clean scan without active indicators'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <div className="text-right">
                    <div className="text-xs font-mono text-slate-500 uppercase">Risk Score</div>
                    <div className="text-lg font-black font-mono text-white">
                      {item.riskScore}
                      <span className="text-xs text-slate-500 font-normal">/100</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedScan(item.details || item)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal for Selected Scan */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Detailed Scan Inspection</span>
              </h3>
              <button
                onClick={() => setSelectedScan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ScanResult result={selectedScan} source={selectedScan.source || 'AUDIT'} />
          </div>
        </div>
      )}
    </div>
  );
}
