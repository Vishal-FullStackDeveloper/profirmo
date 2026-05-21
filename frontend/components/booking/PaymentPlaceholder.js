'use client';

import { CreditCard, Lock, ShieldCheck } from 'lucide-react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { useLanguage } from '@/components/LanguageProvider';
import { formatCurrency } from '@/utils/formatters';

/**
 * PaymentPlaceholder — dummy payment card with disabled inputs.
 *
 * Props: { amount, onPay, processing }
 */
export default function PaymentPlaceholder({ amount, onPay, processing }) {
  const { t } = useLanguage();
  return (
    <Card>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
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

      <div className="mt-4 space-y-3">
        <Input
          label={t('bookCmp.cardNumber')}
          name="card-number"
          placeholder="4242 4242 4242 4242"
          value=""
          onChange={() => {}}
          disabled
          readOnly
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('bookCmp.expiry')}
            name="card-expiry"
            placeholder="MM / YY"
            value=""
            onChange={() => {}}
            disabled
            readOnly
          />
          <Input
            label={t('bookCmp.cvc')}
            name="card-cvc"
            placeholder="123"
            value=""
            onChange={() => {}}
            disabled
            readOnly
          />
        </div>
      </div>

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
        disabled={processing}
      >
        <Lock size={16} />
        {processing
          ? t('bookCmp.processing')
          : t('bookCmp.pay', { amount: formatCurrency(amount) })}
      </Button>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-400">
        <ShieldCheck size={14} className="mt-0.5 shrink-0" />
        {t('bookCmp.paymentPlaceholder')}
      </p>
    </Card>
  );
}
