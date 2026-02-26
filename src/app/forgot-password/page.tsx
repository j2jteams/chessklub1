'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BRAND_NAME } from '@/config/brand';

const FUNCTIONS_BASE =
  process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL ||
  (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ? `https://us-central1-${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net`
    : '');

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (!FUNCTIONS_BASE) {
      console.error('Missing NEXT_PUBLIC_FUNCTIONS_BASE_URL or project id for password reset endpoint.');
      setError('Password reset is not available at the moment. Please contact support.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/requestPasswordReset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        console.error('Password reset request failed', await res.text());
        // Still show generic success so we don't leak anything
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error requesting password reset', err);
      setError('Something went wrong. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{BRAND_NAME}</h1>
          <p className="text-gray-300">Reset your password</p>
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4 text-center">Forgot password</h2>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Enter the email address associated with your account. If it exists, we&apos;ll send you a link to reset your password.
          </p>

          {success ? (
            <div className="space-y-6">
              <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded">
                If an account with that email exists, a password reset link has been sent.
              </div>
              <div className="text-center">
                <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium text-sm">
                  ← Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending link...' : 'Send reset link'}
              </button>

              <div className="mt-4 text-center">
                <Link href="/login" className="text-gray-600 hover:text-gray-800 text-sm">
                  ← Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

