'use client';

// Professional payment history — every payment received into the signed-in
// professional's escrow. For each row we surface the net amount alongside
// the gross so the professional can spot the platform fee at a glance.

import { useCallback, useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PaymentHistoryTable from '@/components/payments/PaymentHistoryTable';
import { listMyPayments } from '@/services/paymentService';
import { ROLES } from '@/utils/constants';

export default function ProfessionalPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await listMyPayments('professional');
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
      role={ROLES.PROFESSIONAL}
      title="Payment history"
      subtitle="Every payment from clients — gross, net to you, and current status"
    >
      <PaymentHistoryTable
        payments={payments}
        loading={loading}
        error={error}
        onReload={load}
        side="professional"
      />
    </DashboardLayout>
  );
}
