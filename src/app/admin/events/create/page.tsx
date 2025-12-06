'use client';

// UPDATED: Unified event form - using ChessEventForm component
import { useAuth } from '@/hooks/useAuth';
import { useRequireRole } from '@/hooks/useRequireRole';
import ChessEventForm from '@/components/admin/ChessEventForm';
import Link from 'next/link';

export default function CreateEventPage() {
  const { loading: authLoading } = useAuth();
  // UPDATED: Chess Tourneys - Allow Super Admin, Franchisee, and Standalone Admin
  const { authorized } = useRequireRole(['superAdmin', 'franchisee', 'standaloneAdmin', 'admin', 'owner']);

  if (authLoading || !authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 chess-themed-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
          <p className="mt-2 text-gray-600">
            Create a new tournament, camp, class, or other chess event.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <ChessEventForm mode="create" />
        </div>
      </div>
    </div>
  );
}
