'use client';

// Client payment history — every payment the signed-in user has made.

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PaymentHistoryTable from '@/components/payments/PaymentHistoryTable';
import { listMyPayments } from '@/services/paymentService';
import { ROLES } from '@/utils/constants';

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await listMyPayments('client');
      setPayments(rows);
    } catch (err) {
      setError(err.message || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout
      role={ROLES.CLIENT}
      title="Payment history"
      subtitle="Every booking payment you've made via Razorpay"
    >
      <PaymentHistoryTable
        payments={payments}
        loading={loading}
        error={error}
        onReload={load}
        side="client"
      />
    </DashboardLayout>
  );
}
