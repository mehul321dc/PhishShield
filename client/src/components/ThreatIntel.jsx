import React from 'react';
import {
  ShieldAlert,
  QrCode,
  AlertTriangle,
  Lock,
  Eye,
  CheckCircle,
  HelpCircle,
  Zap,
  Globe,
  Smartphone,
  Mail
} from 'lucide-react';

export default function ThreatIntel() {
  const attackTypes = [
    {
      title: 'Homograph / Punycode Attacks',
      icon: Globe,
      desc: 'Attackers register domain names using foreign alphabets (e.g. Cyrillic "а" instead of Latin "a") so the link appears identical to "apple.com" or "google.com" in human text, but resolves to a criminal-controlled server.'
    },
    {
      title: 'Quishing (QR Code Phishing)',
      icon: QrCode,
      desc: 'Cybercriminals paste malicious QR stickers on parking meters, restaurants, or embed them in phishing emails to bypass email scanners and trick users into opening credential harvesting pages on their phones.'
    },
    {
      title: 'Typo-Squatting & Brand Spoofing',
      icon: Eye,
      desc: 'Exploits common spelling errors, number substitutions (e.g. "paypa1.com", "g00gle.com"), or chained subdomains ("paypal.com.verify-billing.site") to trick hurried users into submitting passwords.'
    },
    {
      title: 'Deceptive User-Info Credentials (@ Trick)',
      icon: Lock,
      desc: 'Browsers treat strings before the "@" symbol as username credentials. A link like "http://google.com@evil-site.com" looks like Google, but actually takes you directly to "evil-site.com".'
    }
  ];

  const redFlags = [
    {
      title: 'Direct IP Addresses as Links',
      rule: 'http://192.168.1.100/...',
      badge: 'Critical Warning',
      badgeColor: 'bg-red-950 text-red-400 border-red-800'
    },
    {
      title: 'Abused & High-Risk TLDs',
      rule: '.tk, .xyz, .top, .ml, .cf, .work, .click',
      badge: 'High Suspicion',
      badgeColor: 'bg-amber-950 text-amber-400 border-amber-800'
    },
    {
      title: 'Urgent Action & Threatening Words',
      rule: '"Account suspended in 24 hours", "Verify immediately"',
      badge: 'Social Engineering',
      badgeColor: 'bg-indigo-950 text-indigo-400 border-indigo-800'
    },
    {
      title: 'Concealed Redirects & URL Shorteners',
      rule: 'bit.ly, tinyurl without seeing destination',
      badge: 'Obfuscation',
      badgeColor: 'bg-yellow-950 text-yellow-400 border-yellow-800'
    },
    {
      title: 'Unencrypted HTTP for Login Pages',
      rule: 'http:// instead of https://',
      badge: 'Unsafe Protocol',
      badgeColor: 'bg-red-950 text-red-400 border-red-800'
    },
    {
      title: 'Random Character / High Entropy Domains',
      rule: 'x9d82nf01s-cloud.biz (DGA generated)',
      badge: 'DGA Fingerprint',
      badgeColor: 'bg-purple-950 text-purple-400 border-purple-800'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 md:p-8">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800/60 text-cyan-400 text-xs font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>Cyber Threat Intelligence & Prevention Guide</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Understanding Modern Phishing & Quishing Tactics
          </h2>
          <p className="text-sm md:text-base text-slate-300">
            Over 90% of corporate and personal security breaches begin with a deceptively crafted URL or malicious QR code. Learn the mechanics of modern attacks to stay protected.
          </p>
        </div>
      </div>

      {/* Anatomy of Quishing */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/50">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">What is "Quishing" (QR Code Phishing)?</h3>
            <p className="text-xs text-slate-400">Why criminals are replacing email links with QR barcodes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-red-950 text-red-400 font-mono font-bold flex items-center justify-center text-xs">
              01
            </div>
            <h4 className="font-semibold text-white text-sm">Bypasses Email Gateways</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard email filters scan plaintext links in emails. Because QR codes are images, traditional text filters cannot easily read them without optical decoding.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-amber-950 text-amber-400 font-mono font-bold flex items-center justify-center text-xs">
              02
            </div>
            <h4 className="font-semibold text-white text-sm">Forces Device Switching</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Users scan the QR code with their personal smartphones, moving the attack away from company-managed computers with endpoint protection onto less protected mobile devices.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 text-cyan-400 font-mono font-bold flex items-center justify-center text-xs">
              03
            </div>
            <h4 className="font-semibold text-white text-sm">Mobile Viewport Truncation</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mobile browsers have compact address bars that truncate long domain names, hiding the malicious secondary domain from the user's view.
            </p>
          </div>
        </div>
      </div>

      {/* Common Attack Vectors Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Primary URL Attack Vectors</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {attackTypes.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-cyan-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm md:text-base">
                    {item.title}
                  </h4>
                </div>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6 Key Red Flags Checklist */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>Quick Red Flags to Watch Out For</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {redFlags.map((flag, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3"
            >
              <div>
                <h5 className="font-medium text-white text-xs md:text-sm">{flag.title}</h5>
                <code className="text-[11px] text-slate-400 font-mono mt-0.5 block">{flag.rule}</code>
              </div>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border shrink-0 ${flag.badgeColor}`}>
                {flag.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
