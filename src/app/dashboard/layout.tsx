'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Header from '@/components/Header';

// UPDATED: Chess Tourneys - New role system
const navLinks = [
  { href: '/dashboard', label: 'Overview', roles: ['player', 'standaloneAdmin', 'franchisee', 'superAdmin'] },
  { href: '/dashboard/admin', label: 'Event Management', roles: ['standaloneAdmin', 'franchisee', 'superAdmin'] },
  { href: '/dashboard/super-admin', label: 'User Management', roles: ['superAdmin'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600">Preparing your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 chess-themed-bg">
      <Header />
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
        <aside className="md:w-64 bg-white border-r border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-slate-900">Chess Tourneys</h2>
            <p className="text-sm text-gray-500 mt-1">Dashboard</p>
          </div>
          <nav className="p-4 space-y-1">
            {/* Home Link */}
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Home
            </Link>
            
            {/* Dashboard Links */}
            {navLinks
              .filter((link) => {
                const userRole = role ?? 'player';
                return link.roles.includes(userRole);
              })
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition ${
                    pathname === link.href
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
          </nav>
          <div className="p-4 border-t border-gray-100 space-y-3">
            <div>
              <p className="text-xs uppercase text-gray-400 mb-1">Signed in as</p>
              <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{role || 'player'} role</p>
            </div>
            <button
              onClick={async () => {
                try {
                  await signOut(auth);
                  router.push('/');
                } catch (error) {
                  console.error('Error signing out:', error);
                }
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </aside>
        <main className="flex-1 p-6 overflow-x-hidden min-w-0">{children}</main>
      </div>
    </div>
  );
}

