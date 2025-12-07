// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  // Protect super admin routes - only super admins can access
  useRequireRole(['superAdmin']);

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

