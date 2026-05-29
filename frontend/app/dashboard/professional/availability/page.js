'use client';

// Dedicated booking-toggle page. Reuses the OnlineBookingToggle widget so
// the overview page and this page can't drift out of sync.

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import OnlineBookingToggle from '@/components/dashboard/OnlineBookingToggle';
import { ROLES } from '@/utils/constants';

export default function ProfessionalAvailabilityPage() {
  return (
    <DashboardLayout
      role={ROLES.PROFESSIONAL}
      title="Online bookings"
      subtitle="Pause incoming bookings without taking your profile offline"
    >
      <div className="space-y-4">
        <OnlineBookingToggle />
      </div>
    </DashboardLayout>
  );
}
