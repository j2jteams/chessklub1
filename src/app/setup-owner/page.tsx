'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateUserRole, getUserData } from '@/lib/userRoles';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function SetupOwnerPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [setting, setSetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // If already owner/superAdmin, redirect to dashboard
    if (!loading && (role === 'owner' || role === 'superAdmin')) {
      router.push('/dashboard/super-admin');
    }
  }, [role, loading, router]);

  const handleSetOwner = async () => {
    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to set owner role.' });
      return;
    }

    setSetting(true);
    setMessage(null);

    try {
      // First, check if user document exists
      const userData = await getUserData(user.uid);
      
      if (!userData) {
        setMessage({ type: 'error', text: 'User document not found. Please sign out and sign in again to create your user document.' });
        setSetting(false);
        return;
      }

      // Set role to owner and mark as God Owner (first owner)
      // Note: This will fail permission check, but user can set manually in Firebase Console
      await updateUserRole(user.uid, user.uid, 'owner');
      // Set isGodOwner to true for the first owner
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        isGodOwner: true,
        updatedAt: serverTimestamp(),
      });
      
      setMessage({ type: 'success', text: 'Successfully set as Owner! Redirecting...' });
      
      // Wait a moment then redirect
      setTimeout(() => {
        router.push('/dashboard/super-admin');
        // Force a page reload to refresh auth state
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Error setting owner role:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to set owner role. You may need to set it manually in Firebase Console.' 
      });
    } finally {
      setSetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You must be logged in to set owner role.</p>
          <a href="/login" className="text-orange-500 hover:underline">Go to Login</a>
        </div>
      </div>
    );
  }

  if (role === 'owner' || role === 'superAdmin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-green-600 mb-4">You are already set as Owner/Super Admin!</p>
          <a href="/dashboard/super-admin" className="text-orange-500 hover:underline">Go to Super Admin Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Setup Owner Role</h1>
        <p className="text-gray-600 mb-6">
          This is a one-time setup page to assign yourself as the Owner. After this, you can manage roles from the admin dashboard.
        </p>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Current User:</strong> {user.email}
          </p>
          <p className="text-sm text-blue-800 mt-1">
            <strong>Current Role:</strong> {role || 'player'}
          </p>
          <p className="text-xs text-blue-700 mt-2 break-all">
            <strong>User UID:</strong> {user.uid}
          </p>
        </div>

        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Important:</p>
          <p className="text-xs text-yellow-800">
            Due to security rules, you need to set your role manually in Firebase Console. 
            The button below will likely fail, but you can try it first.
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <button
          onClick={handleSetOwner}
          disabled={setting}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {setting ? 'Setting Owner Role...' : 'Set Me as Owner'}
        </button>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-900 mb-1">⚠️ Security Warning:</p>
            <p className="text-xs text-red-800">
              If clicking links redirects you to suspicious sites, you may have browser malware. 
              Type the Firebase Console URL manually instead of clicking links.
            </p>
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-2">Manual Setup Instructions:</p>
          <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside">
            <li>Go to Firebase Console (type this URL manually in your browser): <code className="bg-gray-100 px-2 py-1 rounded text-xs">console.firebase.google.com</code></li>
            <li>Select your project: <strong>chessklub1-b65a1</strong></li>
            <li>Navigate to <strong>Firestore Database</strong> in the left sidebar</li>
            <li>Click on the <strong>users</strong> collection</li>
            <li>Find or create a document with ID: <code className="bg-gray-100 px-1 rounded">{user.uid}</code></li>
            <li>If document exists: Click on it → Click <strong>Edit document</strong> → Set <code className="bg-gray-100 px-1 rounded">role</code> field to <code className="bg-gray-100 px-1 rounded">"owner"</code></li>
            <li>If document doesn't exist: Click <strong>Add document</strong> → Use UID as document ID → Add fields:
              <ul className="ml-4 mt-1 list-disc">
                <li><code className="bg-gray-100 px-1 rounded">uid</code>: {user.uid}</li>
                <li><code className="bg-gray-100 px-1 rounded">email</code>: {user.email}</li>
                <li><code className="bg-gray-100 px-1 rounded">role</code>: "owner"</li>
                <li><code className="bg-gray-100 px-1 rounded">createdAt</code>: (current timestamp)</li>
                <li><code className="bg-gray-100 px-1 rounded">updatedAt</code>: (current timestamp)</li>
              </ul>
            </li>
            <li>After setting the role, <strong>sign out and sign back in</strong> to refresh your session</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

