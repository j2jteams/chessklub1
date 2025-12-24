'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserDocument } from '@/lib/userRoles';
import { createAdminRequest, isAdminApproved } from '@/lib/adminRequests';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type AccountType = 'player' | 'standaloneAdmin' | null;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>(null);
  
  // Player signup fields
  const [playerFirstName, setPlayerFirstName] = useState('');
  const [playerLastName, setPlayerLastName] = useState('');
  const [playerUscfId, setPlayerUscfId] = useState('');
  const [playerLichessUsername, setPlayerLichessUsername] = useState('');
  
  // Admin signup fields
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminFranchiseId, setAdminFranchiseId] = useState('');
  
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase authentication is not initialized.');
      }

      // Sign in
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if admin account is approved
      const approved = await isAdminApproved(user.uid);
      if (!approved) {
        await auth.signOut();
        throw new Error('Your admin account is pending approval. Please wait for Super Admin approval before signing in.');
      }

      router.push('/');
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error: Unable to connect. Please check your internet connection.';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Configuration error: Invalid Firebase API key. Please contact support.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase authentication is not initialized.');
      }

      // Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document with player details
      await createUserDocument(user.uid, user.email ?? email, 'player', {
        firstName: playerFirstName,
        lastName: playerLastName,
        uscfId: playerUscfId || undefined,
        lichessUsername: playerLichessUsername || undefined,
      });

      // Reset form and close modal
      setPlayerFirstName('');
      setPlayerLastName('');
      setPlayerUscfId('');
      setPlayerLichessUsername('');
      setEmail('');
      setPassword('');
      setShowCreateAccount(false);
      setAccountType(null);
      
      router.push('/');
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!auth) {
        throw new Error('Firebase authentication is not initialized.');
      }

      // Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document as player (will be updated when approved)
      await createUserDocument(user.uid, user.email ?? email, 'player', {
        firstName: adminFirstName,
        lastName: adminLastName,
        franchiseId: adminFranchiseId || null,
      });

      // Create admin request (pending approval)
      await createAdminRequest(
        user.uid,
        user.email ?? email,
        adminFirstName,
        adminLastName,
        adminFranchiseId || null
      );

      // Sign out the user (they can't sign in until approved)
      await auth.signOut();

      // Reset form and close modal
      setAdminFirstName('');
      setAdminLastName('');
      setAdminFranchiseId('');
      setEmail('');
      setPassword('');
      setShowCreateAccount(false);
      setAccountType(null);
      
      alert('Your admin account request has been submitted. You will be able to sign in once a Super Admin approves your request.');
      router.push('/');
    } catch (error: any) {
      console.error('Admin signup error:', error);
      
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="text-white">CHESS</span>
            <span className="text-orange-500"> KLUB</span>
          </h1>
          <p className="text-gray-300">Learn Chess. Learn Life Lessons.</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-6">
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setShowCreateAccount(true);
                setError('');
              }}
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Create an account
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            {!accountType ? (
              // Choose Account Type
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Create Account</h2>
                <p className="text-gray-600 mb-6 text-center">Choose your account type:</p>
                
                <div className="space-y-4">
                  <button
                    onClick={() => setAccountType('player')}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-lg transition shadow-lg"
                  >
                    Player Login
                  </button>
                  
                  <button
                    onClick={() => setAccountType('standaloneAdmin')}
                    className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-4 rounded-lg transition shadow-lg"
                  >
                    Admin Login
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    setShowCreateAccount(false);
                    setAccountType(null);
                    setError('');
                  }}
                  className="mt-6 w-full text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : accountType === 'player' ? (
              // Player Signup Form
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Player Sign Up</h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <form onSubmit={handlePlayerSignup} className="space-y-4">
                  <div>
                    <label htmlFor="playerFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      id="playerFirstName"
                      type="text"
                      value={playerFirstName}
                      onChange={(e) => setPlayerFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div>
                    <label htmlFor="playerLastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      id="playerLastName"
                      type="text"
                      value={playerLastName}
                      onChange={(e) => setPlayerLastName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      placeholder="Enter your last name"
                    />
                  </div>

                  <div>
                    <label htmlFor="playerUscfId" className="block text-sm font-medium text-gray-700 mb-2">
                      USCF ID Number <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <input
                      id="playerUscfId"
                      type="text"
                      value={playerUscfId}
                      onChange={(e) => setPlayerUscfId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      placeholder="Enter your USCF ID (optional)"
                    />
                  </div>

                  <div>
                    <label htmlFor="playerLichessUsername" className="block text-sm font-medium text-gray-700 mb-2">
                      LiChess Username <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <input
                      id="playerLichessUsername"
                      type="text"
                      value={playerLichessUsername}
                      onChange={(e) => setPlayerLichessUsername(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      placeholder="Enter your LiChess username (optional)"
                    />
                  </div>

                  <div>
                    <label htmlFor="playerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="playerEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label htmlFor="playerPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      id="playerPassword"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      placeholder="Enter your password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </button>
                </form>

                <button
                  onClick={() => {
                    setAccountType(null);
                    setError('');
                    setPlayerFirstName('');
                    setPlayerLastName('');
                    setPlayerUscfId('');
                    setEmail('');
                    setPassword('');
                  }}
                  className="mt-4 w-full text-gray-600 hover:text-gray-800 text-sm"
                >
                  ← Back
                </button>
              </div>
            ) : (
              // Admin Signup Form
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Admin Sign Up</h2>
                <p className="text-gray-600 mb-4 text-center text-sm">
                  Your account will be pending approval from a Super Admin.
                </p>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <form onSubmit={handleAdminSignup} className="space-y-4">
                  <div>
                    <label htmlFor="adminFirstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      id="adminFirstName"
                      type="text"
                      value={adminFirstName}
                      onChange={(e) => setAdminFirstName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div>
                    <label htmlFor="adminLastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      id="adminLastName"
                      type="text"
                      value={adminLastName}
                      onChange={(e) => setAdminLastName(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      placeholder="Enter your last name"
                    />
                  </div>

                  <div>
                    <label htmlFor="adminFranchiseId" className="block text-sm font-medium text-gray-700 mb-2">
                      Franchise Name <span className="text-gray-500 text-xs">(Optional - leave blank for standalone admin)</span>
                    </label>
                    <input
                      id="adminFranchiseId"
                      type="text"
                      value={adminFranchiseId}
                      onChange={(e) => setAdminFranchiseId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      placeholder="Enter franchise name (optional)"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      If you're associated with a franchise, enter the franchise name. Otherwise, leave blank to become a standalone admin.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="adminEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      id="adminPassword"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      placeholder="Enter your password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting Request...' : 'Submit Admin Request'}
                  </button>
                </form>

                <button
                  onClick={() => {
                    setAccountType(null);
                    setError('');
                    setAdminFirstName('');
                    setAdminLastName('');
                    setAdminFranchiseId('');
                    setEmail('');
                    setPassword('');
                  }}
                  className="mt-4 w-full text-gray-600 hover:text-gray-800 text-sm"
                >
                  ← Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
