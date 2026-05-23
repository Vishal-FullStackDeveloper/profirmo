'use client';

// Dashboard role router — resolves the signed-in user's role and forwards them
// to the matching role-specific dashboard. Guests are sent to /login.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import { useAuth } from '@/components/AuthProvider';

const ROLE_ROUTES = {
  client: '/dashboard/client',
  professional: '/dashboard/professional',
  firm_professional: '/dashboard/professional',
  firm_admin: '/dashboard/firm',
  platform_admin: '/dashboard/admin',
};

// Roles that go through the professional approval workflow.
const PROFESSIONAL_ROLES = ['professional', 'firm_professional'];

// Approval statuses that block access to the professional dashboard. A
// professional with any of these is sent to /application-status instead.
const BLOCKED_APPROVAL = [
  'PENDING_APPROVAL',
  'REJECTED',
  'INFO_REQUESTED',
];

export default function DashboardRouterPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    const role = user && user.role;
    // Professionals who are not yet approved are routed to the application
    // status page so they can track their review / resubmit if needed.
    if (
      PROFESSIONAL_ROLES.includes(role) &&
      BLOCKED_APPROVAL.includes(user && user.approvalStatus)
    ) {
      router.replace('/application-status');
      return;
    }
    const target = ROLE_ROUTES[role] || '/dashboard/client';
    router.replace(target);
  }, [loading, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-amber-50 via-white to-teal-50">
      <BrandLogo href={null} variant="light" />
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
        Loading your dashboard…
      </div>
    </div>
  );
}
