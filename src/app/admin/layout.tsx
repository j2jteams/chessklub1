// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useRequireRole } from '@/hooks/useRequireRole';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // UPDATED: Chess Tourneys - Allow Super Admin, Franchisee, and Standalone Admin
  useRequireRole(['superAdmin', 'franchisee', 'standaloneAdmin']);

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

