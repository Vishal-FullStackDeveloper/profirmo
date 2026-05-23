'use client';

import { Star } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import FirmReviews from '@/components/firms/FirmReviews';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/utils/constants';

export default function FirmReviewsPage() {
  const { user } = useAuth();
  const firmId = user ? user.linkedId || user.firmId : undefined;

  return (
    <DashboardLayout
      role={ROLES.FIRM_ADMIN}
      title="Reviews"
      subtitle="What clients say about your firm's professionals"
    >
      {firmId ? (
        <FirmReviews firmId={firmId} />
      ) : (
        <EmptyState
          icon={<Star size={24} />}
          title="No firm linked"
          description="Your account is not linked to a firm yet, so there are no reviews to show."
        />
      )}
    </DashboardLayout>
  );
}
