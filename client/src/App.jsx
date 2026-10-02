import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UrlScanner from './components/UrlScanner';
import QrScanner from './components/QrScanner';
import HistoryList from './components/HistoryList';
import ThreatIntel from './components/ThreatIntel';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Globe,
  QrCode,
  Activity,
  CheckCircle2,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('url');
  const [stats, setStats] = useState({
    totalScans: 0,
    safeCount: 0,
    suspiciousCount: 0,
    maliciousCount: 0,
    averageRiskScore: 0,
    qrScansCount: 0,
    urlScansCount: 0
  });
  const [statsUpdateTrigger, setStatsUpdateTrigger] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [statsUpdateTrigger]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.success && json.stats) {
        setStats(json.stats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleScanCompleted = () => {
    fetchStats();
    setStatsUpdateTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={stats}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Real-time Threat Intelligence Metrics Ribbon */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Stat 1: Total Scans */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-800/50 text-cyan-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase block">Total Inspected</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {stats.totalScans}
              </span>
            </div>
          </div>

          {/* Stat 2: Safe Verified */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase block">Verified Clean</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                {stats.safeCount}
              </span>
            </div>
          </div>

          {/* Stat 3: Malicious Threats Blocked */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800/50 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase block">Threats Intercepted</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-red-400">
                {stats.maliciousCount}
              </span>
            </div>
          </div>

          {/* Stat 4: Quishing QR Scans */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-950/70 border border-indigo-800/50 text-indigo-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase block">QR Barcode Scans</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-indigo-400">
                {stats.qrScansCount}
              </span>
            </div>
          </div>
        </section>

        {/* Tab Content Display */}
        <section>
          {activeTab === 'url' && (
            <UrlScanner onScanComplete={handleScanCompleted} />
          )}

          {activeTab === 'qr' && (
            <QrScanner onScanComplete={handleScanCompleted} />
          )}

          {activeTab === 'history' && (
            <HistoryList onScanUpdated={statsUpdateTrigger} />
          )}

          {activeTab === 'intel' && (
            <ThreatIntel />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm font-mono text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>PhishShield AI Platform &bull; Real-time Heuristic Threat Engine</span>
          </div>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Engineered for proactive cybersecurity defense. Detects URL phishing, homoglyphs, typosquatting, credential harvesting keywords, and mobile quishing vectors.
          </p>
          <div className="text-[11px] font-mono text-slate-600">
            Node.js Backend (Port 5001) &bull; React Frontend (Vite)
          </div>
        </div>
      </footer>
    </div>
  );
}
