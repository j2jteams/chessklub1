'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const navLinks = [
  { href: '/dashboard', label: 'Overview', roles: ['user', 'admin', 'owner'] },
  { href: '/dashboard/admin', label: 'Admin Console', roles: ['admin', 'owner'] },
  { href: '/dashboard/owner', label: 'Owner Console', roles: ['owner'] },
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
    <div className="min-h-screen bg-slate-50">
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
        <aside className="md:w-64 bg-white border-r border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-slate-900">Chess Klub</h2>
            <p className="text-sm text-gray-500 mt-1">Dashboard</p>
          </div>
          <nav className="p-4 space-y-1">
            {navLinks
              .filter((link) => role && link.roles.includes(role))
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
          <div className="p-4 border-t border-gray-100">
            <p className="text-xs uppercase text-gray-400 mb-1">Signed in as</p>
            <p className="text-sm font-semibold text-slate-900 truncate">{user.email}</p>
            <p className="text-xs text-gray-500 capitalize">{role || 'user'} role</p>
          </div>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

