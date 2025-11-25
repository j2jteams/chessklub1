// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  // Protect owner routes - only owners can access
  useRequireRole(['owner']);

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

