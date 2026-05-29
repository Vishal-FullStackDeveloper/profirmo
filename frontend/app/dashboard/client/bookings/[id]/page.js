'use client';

// Client-side booking detail. Connects the BookingDetailView shared
// component with the /api/bookings/:id/detail endpoint.

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import BookingDetailView from '@/components/booking/BookingDetailView';
import bookingService from '@/services/bookingService';
import { ROLES } from '@/utils/constants';

export default function ClientBookingDetailPage() {
  const params = useParams();
  const id = params && params.id;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await bookingService.getDetail(id);
      setDetail(data);
    } catch (err) {
      setError(err.message || 'Could not load this booking.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <DashboardLayout
      role={ROLES.CLIENT}
      title="Booking detail"
      subtitle="Connect with the professional, capture notes, leave a review"
    >
      <div className="space-y-4">
        <Button
          href="/dashboard/client/bookings"
          variant="outline"
          size="sm"
        >
          <ArrowLeft size={15} />
          Back to bookings
        </Button>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-32 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : error ? (
          <Card>
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle size={22} />
              </span>
              <p className="text-sm font-medium text-slate-700">{error}</p>
              <Button size="sm" onClick={load}>
                Try again
              </Button>
            </div>
          </Card>
        ) : (
          <BookingDetailView detail={detail} viewer="client" onReload={load} />
        )}
      </div>
    </DashboardLayout>
  );
}
