'use client';

// Razorpay-powered payment card on the booking page. Replaces the previous
// disabled-card placeholder. Card numbers and the OTP flow are handled by
// Razorpay's modal, so this card only needs the amount + a single CTA.

import { CreditCard, Lock, ShieldCheck } from 'lucide-react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useLanguage } from '@/components/LanguageProvider';
import { formatCurrency } from '@/utils/formatters';

/**
 * Props:
 *  - amount: number — rupees (we render with formatCurrency)
 *  - onPay: () => void — opens the Razorpay modal
 *  - processing: boolean — disable the button while the order/modal is in flight
 *  - disabled: boolean — additional gating from the parent (date/slot missing)
 */
export default function RazorpayPaymentCard({
  amount,
  onPay,
  processing,
  disabled,
}) {
  const { t } = useLanguage();

  return (
    <Card>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <CreditCard size={18} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            {t('bookCmp.paymentDetails')}
          </h3>
          <p className="text-xs text-slate-500">
            {t('bookCmp.securedCheckout')}
          </p>
        </div>
      </div>

      {/* Razorpay accepts UPI, cards, netbanking and wallets. Surfacing the
          method names here builds trust before the modal opens. */}
      <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
        <li className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="shrink-0 text-emerald-600" />
          {t('bookCmp.razorpaySecure')}
        </li>
        <li className="flex items-center gap-1.5">
          <Lock size={13} className="shrink-0 text-slate-400" />
          {t('bookCmp.razorpayHeldInEscrow')}
        </li>
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-sm font-medium text-slate-600">
          {t('bookCmp.amountDue')}
        </span>
        <span className="text-lg font-bold text-slate-900">
          {formatCurrency(amount)}
        </span>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="mt-4 w-full"
        onClick={onPay}
        disabled={processing || disabled}
      >
        <Lock size={16} />
        {processing
          ? t('bookCmp.processing')
          : t('bookCmp.payWithRazorpay', { amount: formatCurrency(amount) })}
      </Button>

      <p className="mt-3 text-center text-[11px] uppercase tracking-wide text-slate-400">
        {t('bookCmp.razorpayPoweredBy')}
      </p>
    </Card>
  );
}
