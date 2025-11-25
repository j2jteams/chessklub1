// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Protect admin routes - allow both admin and owner
  useRequireRole(['admin', 'owner']);

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

