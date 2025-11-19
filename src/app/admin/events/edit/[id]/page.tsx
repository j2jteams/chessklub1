'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getAllEvents, updateEvent } from '@/lib/events';
import { EventData } from '@/lib/types';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function EditEventPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    location: '',
    price: '',
    description: '',
    image: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      loadEvent();
    }
  }, [authLoading, user, eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      
      if (!eventDoc.exists()) {
        setError('Event not found');
        return;
      }

      const eventData = eventDoc.data() as EventData;
      
      // Check permissions
      if (role !== 'owner' && eventData.createdBy !== user?.uid) {
        setError('You do not have permission to edit this event');
        return;
      }

      setFormData({
        title: eventData.title,
        date: eventData.date,
        location: eventData.location,
        price: eventData.price,
        description: eventData.description || '',
        image: eventData.image || '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSaving(true);

    try {
      // If admin edits, event goes back to pending for owner approval
      const status = role === 'owner' ? 'approved' : 'pending';
      
      await updateEvent(eventId, {
        ...formData,
        status,
      });

      router.push('/admin/events');
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/admin/events"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-semibold transition"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900">Edit Event</h1>
            <Link
              href="/admin/events"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-semibold transition"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {role === 'admin' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Editing this event will require owner approval again.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                placeholder="Enter event title"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  id="date"
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="e.g., March 15-17, 2024"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="e.g., New York, NY"
                />
              </div>
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <input
                id="price"
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                placeholder="e.g., $150"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                placeholder="Enter event description"
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                Image URL (optional)
              </label>
              <input
                id="image"
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/admin/events"
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

