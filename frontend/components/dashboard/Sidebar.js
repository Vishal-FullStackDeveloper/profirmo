'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Building2,
  Users,
  ShieldCheck,
  ScrollText,
  Star,
  Flag,
  Briefcase,
  FolderKanban,
  UserPlus,
  ArrowLeft,
} from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import { useLanguage } from '@/components/LanguageProvider';
import { ROLES } from '@/utils/constants';

// Professional + firm-professional share the same dashboard modules.
const PROFESSIONAL_NAV = [
  {
    labelKey: 'dash.nav.overview',
    href: '/dashboard/professional',
    icon: LayoutDashboard,
  },
  {
    labelKey: 'dash.nav.clients',
    href: '/dashboard/professional/clients',
    icon: Briefcase,
  },
  {
    labelKey: 'dash.nav.cases',
    href: '/dashboard/professional/cases',
    icon: FolderKanban,
  },
  {
    labelKey: 'dash.nav.myReviews',
    href: '/dashboard/professional/reviews',
    icon: Star,
  },
  {
    labelKey: 'dash.nav.myFirm',
    href: '/dashboard/professional/firm',
    icon: Building2,
  },
  {
    labelKey: 'dash.nav.findProfessionals',
    href: '/professionals',
    icon: Search,
  },
];

const NAV_BY_ROLE = {
  [ROLES.CLIENT]: [
    {
      labelKey: 'dash.nav.overview',
      href: '/dashboard/client',
      icon: LayoutDashboard,
    },
    {
      labelKey: 'dash.nav.findProfessionals',
      href: '/professionals',
      icon: Search,
    },
    { labelKey: 'dash.nav.browseFirms', href: '/firms', icon: Building2 },
  ],
  [ROLES.PROFESSIONAL]: PROFESSIONAL_NAV,
  [ROLES.FIRM_PROFESSIONAL]: PROFESSIONAL_NAV,
  [ROLES.FIRM_ADMIN]: [
    {
      labelKey: 'dash.nav.overview',
      href: '/dashboard/firm',
      icon: LayoutDashboard,
    },
    {
      labelKey: 'dash.nav.firmProfessionals',
      href: '/dashboard/firm/professionals',
      icon: Users,
    },
    {
      labelKey: 'dash.nav.joinRequests',
      href: '/dashboard/firm/join-requests',
      icon: UserPlus,
    },
    {
      labelKey: 'dash.nav.clients',
      href: '/dashboard/firm/clients',
      icon: Briefcase,
    },
    {
      labelKey: 'dash.nav.cases',
      href: '/dashboard/firm/cases',
      icon: FolderKanban,
    },
    {
      labelKey: 'dash.nav.reviews',
      href: '/dashboard/firm/reviews',
      icon: Star,
    },
    {
      labelKey: 'dash.nav.firmProfile',
      href: '/dashboard/firm/profile',
      icon: Building2,
    },
  ],
  [ROLES.PLATFORM_ADMIN]: [
    {
      labelKey: 'dash.nav.overview',
      href: '/dashboard/admin',
      icon: LayoutDashboard,
    },
    {
      labelKey: 'dash.nav.professionalApprovals',
      href: '/admin/professionals',
      icon: ShieldCheck,
    },
    {
      labelKey: 'dash.nav.firmApprovals',
      href: '/admin/firms',
      icon: Building2,
    },
    { labelKey: 'dash.nav.users', href: '/admin/users', icon: Users },
    {
      labelKey: 'dash.nav.reviews',
      href: '/admin/reviews',
      icon: Star,
    },
    {
      labelKey: 'dash.nav.reviewAppeals',
      href: '/admin/review-appeals',
      icon: Flag,
    },
    {
      labelKey: 'dash.nav.auditLogs',
      href: '/admin/audit-logs',
      icon: ScrollText,
    },
  ],
};

/**
 * Sidebar — Pro Firmo logo + role-specific navigation.
 * Props: { role }
 */
export default function Sidebar({ role }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const items = NAV_BY_ROLE[role] || NAV_BY_ROLE[ROLES.CLIENT];

  function isActive(href) {
    return pathname === href;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <BrandLogo variant="light" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('dash.nav.menu')}
        </p>
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon size={18} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-3 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft size={18} />
          {t('dash.nav.backToSite')}
        </Link>
      </div>
    </div>
  );
}
