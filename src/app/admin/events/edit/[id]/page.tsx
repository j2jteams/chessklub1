'use client';

// UPDATED: Unified event form - using ChessEventForm component
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRequireRole } from '@/hooks/useRequireRole';
import { getEvent, eventDataToChessEvent } from '@/lib/events';
import ChessEventForm from '@/components/admin/ChessEventForm';
import { ChessEvent } from '@/lib/types';
import Link from 'next/link';

export default function EditEventPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  // UPDATED: Chess Tourneys - Allow Super Admin, Franchisee, and Standalone Admin
  const { authorized } = useRequireRole(['superAdmin', 'franchisee', 'standaloneAdmin', 'admin', 'owner']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventData, setEventData] = useState<ChessEvent | null>(null);

  useEffect(() => {
    if (!authLoading && user && authorized && eventId) {
      loadEvent();
    }
  }, [authLoading, user, authorized, eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const event = await getEvent(eventId);
      
      if (!event) {
        setError('Event not found');
        return;
      }

      // Check permissions based on new role system
      const userRole = role ?? 'player';
      const canEdit = 
        userRole === 'superAdmin' || userRole === 'owner' || // Super Admin can edit all
        (userRole === 'franchisee' && event.franchiseId === user?.uid) || // Franchisee can edit their franchise events
        ((userRole === 'standaloneAdmin' || userRole === 'admin') && event.createdBy === user?.uid); // Standalone Admin can edit own events
      
      if (!canEdit) {
        setError('You do not have permission to edit this event');
        return;
      }

      // Convert EventData to ChessEvent format
      const chessEvent = eventDataToChessEvent(event);
      setEventData(chessEvent);
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/admin/events"
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            ← Back to Events
          </Link>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Event not found</p>
          <Link
            href="/admin/events"
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            ← Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 chess-themed-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/admin/events"
            className="text-orange-600 hover:text-orange-700 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Events
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
          <p className="mt-2 text-gray-600">
            Update event details, sections, and add-ons.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <ChessEventForm mode="edit" initialData={eventData} />
        </div>
      </div>
    </div>
  );
}
