import React, { useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Globe,
  Lock,
  Unlock,
  Server,
  Zap,
  CheckCircle,
  ExternalLink,
  Copy,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ScanResult({ result, source = 'URL' }) {
  if (!result) return null;

  const {
    url,
    riskScore = 0,
    verdict = 'SAFE',
    verdictText = 'Safe to Browse',
    parsed = {},
    dns = {},
    metrics = {},
    redirects,
    flags = [],
    analysisTimeMs,
    scannedAt
  } = result;

  useEffect(() => {
    if (verdict === 'SAFE') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#06b6d4', '#3b82f6']
      });
    }
  }, [verdict, url]);

  const isSafe = verdict === 'SAFE';
  const isSuspicious = verdict === 'SUSPICIOUS';
  const isMalicious = verdict === 'MALICIOUS';

  const badgeConfig = {
    SAFE: {
      bgColor: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400',
      glowClass: 'cyber-glow-success border-emerald-500/50',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      barColor: 'bg-emerald-500',
      title: 'CLEAN & SAFE',
      desc: 'No known malicious patterns, typo-squatting, or credential theft vectors found.'
    },
    SUSPICIOUS: {
      bgColor: 'bg-amber-950/60 border-amber-500/40 text-amber-400',
      glowClass: 'cyber-glow-warning border-amber-500/50',
      icon: AlertTriangle,
      color: 'text-amber-400',
      barColor: 'bg-amber-500',
      title: 'SUSPICIOUS RISK',
      desc: 'Anomalies detected. Proceed with heightened caution and verify the source.'
    },
    MALICIOUS: {
      bgColor: 'bg-red-950/60 border-red-500/40 text-red-400',
      glowClass: 'cyber-glow-danger border-red-500/50',
      icon: ShieldAlert,
      color: 'text-red-400',
      barColor: 'bg-red-500',
      title: 'PHISHING / MALICIOUS THREAT',
      desc: 'High probability of phishing attack, credential harvesting, or brand impersonation. DO NOT ENTER DATA!'
    }
  }[verdict] || {
    bgColor: 'bg-slate-900 border-slate-700 text-slate-300',
    glowClass: '',
    icon: Info,
    color: 'text-slate-300',
    barColor: 'bg-slate-500',
    title: verdict,
    desc: verdictText
  };

  const BadgeIcon = badgeConfig.icon;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Main Verdict Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 backdrop-blur-md transition-all ${badgeConfig.bgColor} ${badgeConfig.glowClass}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-xl bg-slate-900/80 border border-current shadow-lg shrink-0 ${badgeConfig.color}`}>
              <BadgeIcon className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <span className="text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300">
                  {source} SCAN VERDICT
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {analysisTimeMs ? `${analysisTimeMs}ms` : 'Instant'}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-1">
                {badgeConfig.title}
              </h2>
              <p className="text-sm md:text-base text-slate-300 max-w-xl">
                {badgeConfig.desc}
              </p>
            </div>
          </div>

          {/* Risk Score Circle / Meter */}
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/80 border border-slate-800 shrink-0 min-w-[150px]">
            <span className="text-xs font-mono uppercase text-slate-400 mb-1">Threat Score</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-black ${badgeConfig.color}`}>
                {riskScore}
              </span>
              <span className="text-sm font-semibold text-slate-500">/ 100</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full ${badgeConfig.barColor} transition-all duration-700`}
                style={{ width: `${Math.max(5, riskScore)}%` }}
              />
            </div>
            <span className="text-[11px] font-mono mt-1 text-slate-400">
              {riskScore >= 60 ? 'Critical Risk' : riskScore >= 25 ? 'Moderate Risk' : 'Low / No Risk'}
            </span>
          </div>
        </div>

        {/* Analyzed Target Box */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-mono uppercase text-slate-400 block mb-1">Scanned Target:</span>
            <div className="font-mono text-sm text-cyan-300 bg-slate-950/70 px-3.5 py-2 rounded-lg border border-slate-800 break-all select-all flex items-center justify-between gap-2">
              <span className="truncate">{url}</span>
              <button
                onClick={() => copyToClipboard(url)}
                title="Copy Link"
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isSafe && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold tracking-wide transition-colors shrink-0 shadow-md"
            >
              <span>Visit Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Unshortened Redirect Chain (if applicable) */}
        {redirects && redirects.isShortened && (
          <div className="mt-4 p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
            <div className="text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Redirect Chain Unveiled:</span>
            </div>
            <div className="text-slate-300 space-y-1">
              {redirects.chain.map((step, idx) => (
                <div key={idx} className="flex items-center gap-1.5 break-all">
                  <span className="text-slate-500">[{idx + 1}]</span>
                  <span className={idx === redirects.chain.length - 1 ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
                    {step}
                  </span>
                  {idx < redirects.chain.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Security Flags & Diagnostic Checklist */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Security Diagnostics & Indicator Flags</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
            {flags.length} Checked
          </span>
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {flags.map((flag, idx) => {
            const severityColor = {
              CRITICAL: 'bg-red-950/80 border-red-500/50 text-red-200',
              HIGH: 'bg-red-950/40 border-red-600/40 text-red-300',
              MEDIUM: 'bg-amber-950/40 border-amber-600/40 text-amber-300',
              LOW: 'bg-yellow-950/30 border-yellow-600/30 text-yellow-300',
              INFO: 'bg-slate-900/80 border-slate-800 text-slate-300'
            }[flag.severity] || 'bg-slate-900/80 border-slate-800 text-slate-300';

            const severityBadge = {
              CRITICAL: 'bg-red-600 text-white',
              HIGH: 'bg-red-500 text-white',
              MEDIUM: 'bg-amber-500 text-slate-950',
              LOW: 'bg-yellow-500 text-slate-950',
              INFO: 'bg-cyan-900 text-cyan-300'
            }[flag.severity] || 'bg-slate-700 text-white';

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border backdrop-blur-sm transition-all flex flex-col md:flex-row md:items-start justify-between gap-3 ${severityColor}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${severityBadge}`}>
                      {flag.severity}
                    </span>
                    <h4 className="font-semibold text-white text-sm md:text-base">
                      {flag.title}
                    </h4>
                  </div>
                  <p className="text-xs md:text-sm text-slate-300/90 leading-relaxed">
                    {flag.description}
                  </p>
                  {flag.recommendation && (
                    <div className="pt-1 text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                      <span className="font-bold">Recommendation:</span>
                      <span>{flag.recommendation}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Technical Forensic Breakdown Grid */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Technical Parameters & Protocol Telemetry</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Protocol & Port */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              {metrics.isHttps ? (
                <Lock className="w-4 h-4 text-emerald-400" />
              ) : (
                <Unlock className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-xs font-mono uppercase">Protocol Security</span>
            </div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>{parsed.protocol || 'HTTP:'}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Port {parsed.port || '80'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {metrics.isHttps ? 'Encrypted SSL/TLS traffic' : 'Unencrypted plain traffic'}
            </p>
          </div>

          {/* Card 2: Host & TLD */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono uppercase">Hostname & TLD</span>
            </div>
            <div className="text-base font-bold text-white truncate" title={parsed.hostname}>
              {parsed.hostname || 'Unknown'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              TLD: <span className="font-mono text-cyan-300">.{parsed.tld || 'unknown'}</span>
              {metrics.isIpv4 && ' (Direct IP)'}
              {metrics.isPunycode && ' (Punycode IDN)'}
            </p>
          </div>

          {/* Card 3: DNS Live Resolution */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Server className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-mono uppercase">DNS Reachability</span>
            </div>
            <div className="text-base font-bold text-white flex items-center gap-1.5">
              {dns.resolved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400">Resolved Live</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-amber-400">Unresolved / Offline</span>
                </>
              )}
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1 truncate" title={dns.ipAddresses?.join(', ') || 'N/A'}>
              {dns.ipAddresses && dns.ipAddresses.length > 0
                ? `${dns.ipAddresses[0]}${dns.ipAddresses.length > 1 ? ` (+${dns.ipAddresses.length - 1})` : ''}`
                : 'No IP returned'}
            </p>
          </div>

          {/* Card 4: Lexical Structure */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono uppercase">Structural Heuristics</span>
            </div>
            <div className="text-base font-bold text-white flex items-center gap-2">
              <span>Entropy: {metrics.entropy ?? 0}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Length: {metrics.length || 0} chars | Subdomains: {metrics.subdomainsCount || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
