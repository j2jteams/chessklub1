// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createAdminRequest, getPendingAdminRequestByUserId } from '@/lib/adminRequests';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function RequestAdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [checkingRequest, setCheckingRequest] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      // Only players can request admin access
      if (role !== 'player' && role !== null) {
        router.push('/dashboard');
        return;
      }
      checkExistingRequest();
    }
  }, [user, role, authLoading, router]);

  const checkExistingRequest = async () => {
    if (!user) return;
    try {
      const existingRequest = await getPendingAdminRequestByUserId(user.uid);
      setHasPendingRequest(!!existingRequest);
    } catch (err: any) {
      console.error('Error checking existing request:', err);
    } finally {
      setCheckingRequest(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      await createAdminRequest(
        user.uid,
        user.email || '',
        displayName.trim() || undefined,
        reason.trim() || undefined
      );
      setSuccess(true);
      setHasPendingRequest(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit admin request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (role !== 'player' && role !== null)) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Request Admin Access</h1>
            <p className="text-gray-600">
              Submit a request to become an admin. An owner will review your request.
            </p>
          </div>

          {hasPendingRequest && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-800">Pending Request</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    You already have a pending admin request. Please wait for an owner to review it.
                  </p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-green-800">Request Submitted</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your admin request has been submitted successfully. An owner will review it soon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {!hasPendingRequest && !success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">This is your registered email address</p>
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name (Optional)
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Request (Optional)
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="Tell us why you'd like to become an admin..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Providing a reason may help owners make a decision faster.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/dashboard"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

