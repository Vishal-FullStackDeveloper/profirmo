'use client';

// Redirect to the single canonical profile-edit page. We used to host a
// professional-specific edit form here; consolidating to `/profile/edit`
// removes the "two edit pages" confusion.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfessionalProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/profile/edit');
  }, [router]);
  return null;
}
