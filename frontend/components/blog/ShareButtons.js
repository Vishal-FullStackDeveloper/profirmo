'use client';

// ShareButtons — sticky social-share rail used on the blog detail page.
// Each button opens a centred popup with the platform's share URL; we also
// expose a "Copy link" button that uses the Clipboard API with a tiny
// "Copied!" tooltip that auto-dismisses.

import { useState } from 'react';
import {
  Linkedin,
  Twitter,
  Facebook,
  Link2,
  Check,
  MessageCircle,
} from 'lucide-react';

function openShare(url) {
  if (typeof window === 'undefined') return;
  window.open(
    url,
    'share',
    'noopener,noreferrer,width=600,height=540,menubar=0,toolbar=0,status=0'
  );
}

export default function ShareButtons({ url, title, description }) {
  const [copied, setCopied] = useState(false);

  const fullUrl = (() => {
    if (!url) return '';
    if (/^https?:\/\//.test(url)) return url;
    if (typeof window !== 'undefined') return `${window.location.origin}${url}`;
    return url;
  })();
  const encUrl = encodeURIComponent(fullUrl);
  const encTitle = encodeURIComponent(title || '');
  const encDesc = encodeURIComponent(description || '');

  const platforms = [
    {
      label: 'Share on X',
      icon: Twitter,
      bg: 'hover:bg-slate-900 hover:text-white',
      onClick: () =>
        openShare(`https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`),
    },
    {
      label: 'Share on LinkedIn',
      icon: Linkedin,
      bg: 'hover:bg-[#0a66c2] hover:text-white',
      onClick: () =>
        openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`),
    },
    {
      label: 'Share on Facebook',
      icon: Facebook,
      bg: 'hover:bg-[#1877f2] hover:text-white',
      onClick: () =>
        openShare(`https://www.facebook.com/sharer/sharer.php?u=${encUrl}`),
    },
    {
      label: 'Share on WhatsApp',
      icon: MessageCircle,
      bg: 'hover:bg-[#25d366] hover:text-white',
      onClick: () =>
        openShare(`https://wa.me/?text=${encTitle}%20${encUrl}`),
    },
  ];

  async function copyLink() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore — fall back to nothing */
    }
  }

  return (
    <div className="flex flex-row items-center gap-2 lg:flex-col">
      {platforms.map(({ label, icon: Icon, bg, onClick }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          title={label}
          aria-label={label}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition ${bg}`}
        >
          <Icon size={16} />
        </button>
      ))}
      <button
        type="button"
        onClick={copyLink}
        title="Copy link"
        aria-label="Copy link"
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-amber-400 hover:text-amber-700 ${
          copied ? 'border-emerald-400 text-emerald-600' : ''
        }`}
      >
        {copied ? <Check size={16} /> : <Link2 size={16} />}
        {copied && (
          <span className="pointer-events-none absolute -top-7 right-0 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
            Copied!
          </span>
        )}
      </button>
    </div>
  );
}
