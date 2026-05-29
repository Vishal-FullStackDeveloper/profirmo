'use client';

// ConnectChips — three small icon buttons that open the OS's phone dialer,
// WhatsApp web/app and the default mail client respectively. Rendered on
// booking listing rows + the booking detail page header.
//
// Phone normalisation: WhatsApp's wa.me deep link requires a country-code
// prefix (no `+` or leading zeros). We assume India (+91) for any 10-digit
// number to match the rest of the platform; otherwise we pass through what
// the user typed, minus formatting.

import { Phone, Mail, MessageCircle } from 'lucide-react';

function digitsOnly(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

function waNumber(value) {
  const d = digitsOnly(value);
  if (!d) return '';
  if (d.length === 10) return `91${d}`;
  // Strip a leading 0 if someone entered 0XXXXXXXXXX.
  if (d.length === 11 && d.startsWith('0')) return `91${d.slice(1)}`;
  return d;
}

/**
 * Props:
 *  - phone: string | null
 *  - email: string | null
 *  - waMessage: string — pre-filled WhatsApp greeting
 *  - emailSubject: string
 *  - size: 'sm' | 'md' (controls icon + padding)
 *  - layout: 'row' | 'stack'
 */
export default function ConnectChips({
  phone,
  email,
  waMessage = '',
  emailSubject = '',
  size = 'sm',
  layout = 'row',
}) {
  const hasPhone = Boolean(digitsOnly(phone));
  const hasEmail = Boolean(email && /@/.test(email));
  if (!hasPhone && !hasEmail) return null;

  const dim = size === 'md' ? 16 : 14;
  const padding = size === 'md' ? 'h-9 w-9' : 'h-8 w-8';

  const base =
    'inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700';
  const container =
    layout === 'stack'
      ? 'flex flex-col items-stretch gap-2'
      : 'flex items-center gap-1.5';

  return (
    <div className={container}>
      {hasPhone && (
        <a
          href={`tel:${digitsOnly(phone)}`}
          className={`${base} ${padding}`}
          title="Call"
          aria-label="Call"
        >
          <Phone size={dim} />
        </a>
      )}
      {hasPhone && (
        <a
          href={`https://wa.me/${waNumber(phone)}${
            waMessage ? `?text=${encodeURIComponent(waMessage)}` : ''
          }`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} ${padding}`}
          title="WhatsApp"
          aria-label="WhatsApp"
        >
          <MessageCircle size={dim} />
        </a>
      )}
      {hasEmail && (
        <a
          href={`mailto:${email}${
            emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ''
          }`}
          className={`${base} ${padding}`}
          title="Email"
          aria-label="Email"
        >
          <Mail size={dim} />
        </a>
      )}
    </div>
  );
}
