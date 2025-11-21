'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { getApprovedEvents } from '@/lib/events';
import { EventData } from '@/lib/types';

export default function Header() {
  const { user, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tournamentsOpen, setTournamentsOpen] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const dashboardLink =
    role === 'owner'
      ? { href: '/dashboard/owner', label: 'Owner Console' }
      : role === 'admin'
        ? { href: '/dashboard/admin', label: 'Admin Console' }
        : { href: '/dashboard', label: 'My Dashboard' };

  // Fetch approved events for tournaments dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const approvedEvents = await getApprovedEvents();
        setEvents(approvedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Filter events: new (last 7 days) and upcoming (future dates)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const newTournaments = events.filter(event => {
    const eventDate = event.createdAt ? new Date(event.createdAt) : null;
    return eventDate && eventDate >= sevenDaysAgo;
  });

  const upcomingEvents = events.filter(event => {
    // Try to parse the date string - handle various formats
    if (!event.date) return false;
    try {
      const eventDate = new Date(event.date);
      return !isNaN(eventDate.getTime()) && eventDate >= now;
    } catch {
      // If date parsing fails, include it anyway (better to show than hide)
      return true;
    }
  });

  return (
    <>
      {/* Top Bar - Black with contact info */}
      <div className="bg-black text-white py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span>hello@chessklub.com</span>
            </div>
            <div className="flex items-center space-x-6">
              <span>Call Us Today: (704) 248-6999</span>
              <div className="flex items-center space-x-3">
                <a href="#" className="hover:opacity-80 transition" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="hover:opacity-80 transition" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="hover:opacity-80 transition" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40" style={{ backgroundColor: 'var(--color-light)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <img src="/Ck Logo Enchanced.png" alt="Chess Klub Logo" className="h-16 w-auto cursor-pointer" />
              </Link>
            </div>

            {/* Navigation Menu */}
            <div className="hidden md:flex space-x-1 lg:space-x-2 items-center">
              {/* Tournaments Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setTournamentsOpen(!tournamentsOpen)}
                  className="flex items-center gap-1 px-4 py-2 transition font-medium rounded-md hover:bg-gray-50"
                  style={{ color: 'var(--color-dark)' }}
                >
                  Tournaments
                  <svg
                    className={`w-4 h-4 transition-transform ${tournamentsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {tournamentsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Tournaments</p>
                    </div>
                    <Link
                      href="/tournaments?filter=new"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                      onClick={() => setTournamentsOpen(false)}
                    >
                      <div className="flex items-center justify-between">
                        <span>New Tournaments</span>
                        {newTournaments.length > 0 && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {newTournaments.length}
                          </span>
                        )}
                      </div>
                    </Link>
                    <Link
                      href="/tournaments?filter=upcoming"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                      onClick={() => setTournamentsOpen(false)}
                    >
                      <div className="flex items-center justify-between">
                        <span>Upcoming Events</span>
                        {upcomingEvents.length > 0 && (
                          <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {upcomingEvents.length}
                          </span>
                        )}
                      </div>
                    </Link>
                    <Link
                      href="/tournaments"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition border-t border-gray-100 mt-1"
                      onClick={() => setTournamentsOpen(false)}
                    >
                      View All Tournaments
                    </Link>
                  </div>
                )}
              </div>

              {/* Online Tutoring */}
              <Link
                href="/online-tutoring"
                className="px-4 py-2 transition font-medium rounded-md hover:bg-gray-50"
                style={{ color: 'var(--color-dark)' }}
              >
                Online Tutoring
              </Link>

              {/* Merchandise */}
              <Link
                href="/merchandise"
                className="px-4 py-2 transition font-medium rounded-md hover:bg-gray-50"
                style={{ color: 'var(--color-dark)' }}
              >
                Merchandise
              </Link>

              {/* Ranking */}
              <Link
                href="/ranking"
                className="px-4 py-2 transition font-medium rounded-md hover:bg-gray-50"
                style={{ color: 'var(--color-dark)' }}
              >
                Ranking
              </Link>

              {/* Locations */}
              <Link
                href="/locations"
                className="px-4 py-2 transition font-medium rounded-md hover:bg-gray-50"
                style={{ color: 'var(--color-dark)' }}
              >
                Locations
              </Link>
            </div>

            {/* User Menu / Login */}
            <div className="flex items-center gap-4 relative">
              {user ? (
                <>
                  <button
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full font-medium transition"
                    onClick={() => setMenuOpen((prev) => !prev)}
                  >
                    <span className="hidden sm:inline text-sm">{user.email}</span>
                    <span className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-semibold">
                      {user.email?.[0]?.toUpperCase() ?? 'U'}
                    </span>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-slate-900">
                          {dashboardLink.label.replace('Console', '')}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href={dashboardLink.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition"
                        onClick={() => setMenuOpen(false)}
                      >
                        Go to {dashboardLink.label}
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          handleSignOut();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-white font-semibold transition shadow-lg"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-light)',
                    padding: '8px 16px',
                    borderRadius: '4px',
                  }}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Close dropdowns when clicking outside */}
      {(tournamentsOpen || menuOpen) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setTournamentsOpen(false);
            setMenuOpen(false);
          }}
        />
      )}
    </>
  );
}
