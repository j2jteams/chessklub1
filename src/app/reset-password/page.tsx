'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { BRAND_NAME } from '@/config/brand';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const oobCode = searchParams.get('oobCode') || '';
  const [email, setEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!oobCode) {
        setError('Invalid or missing password reset code.');
        setLoading(false);
        return;
      }

      try {
        const emailFromCode = await verifyPasswordResetCode(auth, oobCode);
        setEmail(emailFromCode);
      } catch (err) {
        console.error('Invalid or expired password reset code', err);
        setError('This password reset link is invalid or has expired. Please request a new one.');
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) {
      setError('Invalid password reset code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      // Optionally redirect after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      console.error('Failed to reset password', err);
      let message = 'Failed to reset password. This link may have expired. Please request a new one.';
      if (err?.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters.';
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{BRAND_NAME}</h1>
          <p className="text-gray-300">Set a new password</p>
        </div>

        <div className="bg-white rounded-lg shadow-2xl p-8">
          {loading ? (
            <p className="text-center text-gray-600">Validating reset link...</p>
          ) : success ? (
            <div className="space-y-6 text-center">
              <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded">
                Your password has been reset successfully. Redirecting you to the login page...
              </div>
              <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium text-sm">
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
                  {error}
                </div>
              )}

              {email && (
                <p className="text-sm text-gray-600">
                  Resetting password for <span className="font-medium">{email}</span>
                </p>
              )}

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="Enter a new password"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="Re-enter your new password"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Resetting...' : 'Reset password'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center text-gray-300">
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

