import React, { useState } from 'react';
import { Search, Loader2, X, Clipboard, ShieldCheck, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import ScanResult from './ScanResult';

const PRESET_URLS = [
  {
    name: 'Safe: Google',
    url: 'https://google.com',
    type: 'safe'
  },
  {
    name: 'Safe: GitHub',
    url: 'https://github.com',
    type: 'safe'
  },
  {
    name: 'Phish: Fake PayPal',
    url: 'http://paypal-security-update.account-verification-login.tk/signin',
    type: 'danger'
  },
  {
    name: 'Phish: Direct IP Bank',
    url: 'http://192.168.1.100/chase-online/banking/login.php',
    type: 'danger'
  },
  {
    name: 'Suspicious: Fake Airdrop',
    url: 'http://free-crypto-giveaway-airdrop.xyz/claim-reward',
    type: 'warning'
  }
];

export default function UrlScanner({ onScanComplete }) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scanData, setScanData] = useState(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    setUrl('');
    setError(null);
  };

  const performScan = async (targetUrl) => {
    const urlToScan = (targetUrl || url).trim();
    if (!urlToScan) {
      setError('Please enter a website link or address to inspect.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/scan-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScan })
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to scan URL');
      }

      setScanData(json.data);
      if (onScanComplete) {
        onScanComplete();
      }
    } catch (err) {
      setError(err.message || 'Network error while contacting scanner server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performScan();
  };

  const handlePresetClick = (presetUrl) => {
    setUrl(presetUrl);
    performScan(presetUrl);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Input Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="max-w-3xl mx-auto space-y-5 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/50 text-cyan-400 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI & Heuristic URL Threat Analysis Engine</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
            Inspect Any Link for Phishing & Malicious Attacks
          </h2>

          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
            Detect fake domain spoofing, homograph lookalikes, credential harvesters, suspicious TLDs, and stealth redirect loops before you click.
          </p>

          {/* Search Bar Form */}
          <form onSubmit={handleSubmit} className="relative mt-4">
            <div className="relative flex items-center bg-slate-950/90 rounded-xl border border-slate-700/80 shadow-inner focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all p-1.5">
              <Search className="w-5 h-5 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter suspicious link (e.g. http://paypal-verify-login.tk or google.com)..."
                className="w-full bg-transparent px-3 py-2.5 text-sm md:text-base text-white placeholder:text-slate-500 focus:outline-none font-mono"
                disabled={isLoading}
              />

              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handlePaste}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:bg-slate-800 transition-colors shrink-0 mr-1"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>

              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg flex items-center gap-2 shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Scan Link</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Presets */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 font-mono">Test Presets:</span>
            {PRESET_URLS.map((preset, idx) => {
              const chipColor =
                preset.type === 'safe'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/40'
                  : preset.type === 'warning'
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/40 hover:bg-amber-900/40'
                  : 'bg-red-950/40 text-red-300 border-red-800/40 hover:bg-red-900/40';

              return (
                <button
                  key={idx}
                  onClick={() => handlePresetClick(preset.url)}
                  disabled={isLoading}
                  className={`px-2.5 py-1 rounded-full border transition-colors font-mono cursor-pointer ${chipColor}`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 text-red-300 text-sm flex items-center justify-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading Scanning Radar View */}
      {isLoading && (
        <div className="p-8 rounded-2xl bg-slate-900/60 border border-cyan-800/40 text-center space-y-3 animate-pulse">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
            <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <ShieldCheck className="w-6 h-6 text-cyan-400 absolute" />
          </div>
          <h3 className="text-base font-bold text-white">Performing Heuristic Security Inspection</h3>
          <p className="text-xs font-mono text-cyan-400">
            Checking DNS records, SSL protocol, brand homoglyphs, and obfuscated subdomains...
          </p>
        </div>
      )}

      {/* Results Display */}
      {scanData && !isLoading && (
        <ScanResult result={scanData} source="URL" />
      )}
    </div>
  );
}
