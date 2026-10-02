import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Globe,
  QrCode,
  Clock,
  BookOpen,
  Activity,
  AlertTriangle
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, stats }) {
  const [serverOnline, setServerOnline] = useState(null);
  const [latency, setLatency] = useState(null);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    const start = Date.now();
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setServerOnline(true);
        setLatency(Date.now() - start);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  };

  const navItems = [
    { id: 'url', label: 'URL Scanner', icon: Globe },
    { id: 'qr', label: 'QR Quishing Scanner', icon: QrCode },
    { id: 'history', label: 'Scan History', icon: Clock },
    { id: 'intel', label: 'Threat Intel', icon: BookOpen }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white border border-cyan-400/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base md:text-lg tracking-tight text-white font-mono">
                  PhishShield<span className="text-cyan-400">.AI</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden md:block">
                URL Phishing & Quishing Detection Platform
              </p>
            </div>
          </div>

          {/* Nav Tabs for Desktop */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* System Telemetry & Quick Stats */}
          <div className="flex items-center gap-2.5">
            {/* Server Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                serverOnline
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : serverOnline === false
                  ? 'bg-red-950/60 border-red-800 text-red-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  serverOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                }`}
              />
              <span className="hidden sm:inline">
                {serverOnline ? `Engine: ${latency}ms` : 'Connecting...'}
              </span>
            </div>

            {/* Quick Threat Count */}
            {stats && stats.totalScans > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>{stats.totalScans} Scans</span>
                {stats.maliciousCount > 0 && (
                  <span className="text-red-400 font-bold">
                    ({stats.maliciousCount} threats)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-slate-800/80 text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                  isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
