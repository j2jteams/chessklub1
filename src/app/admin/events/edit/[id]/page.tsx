// UPDATED: role-based routing and approval flows - Phase 0.5
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRequireRole } from '@/hooks/useRequireRole';
import { getAllEvents, updateEvent } from '@/lib/events';
import { uploadImage } from '@/lib/storage';
import { EventData, EventCategory } from '@/lib/types';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function EditEventPage() {
  // Protect route - allow both admin and owner
  useRequireRole(['admin', 'owner']);
  
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    price: '',
    description: '',
    image: '',
    category: 'event' as EventCategory,
    contactEmail: '',
    contactPhone: '',
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
        time: eventData.time || '',
        location: eventData.location,
        price: eventData.price,
        description: eventData.description || '',
        image: eventData.image || '',
        category: eventData.category || 'event',
        contactEmail: eventData.contactEmail || '',
        contactPhone: eventData.contactPhone || '',
      });
      
      if (eventData.image) {
        setImagePreview(eventData.image);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError('');
    setUploadingImage(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const imageUrl = await uploadImage(file);
      setFormData({ ...formData, image: imageUrl });
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, image: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSaving(true);

    try {
      // If admin edits, event goes back to pending for owner approval
      // UPDATED: role-based routing and approval flows - Phase 0.5
      const status = role === 'owner' ? 'approved' : 'pendingApproval';
      
      await updateEvent(eventId, {
        title: formData.title,
        date: formData.date,
        time: formData.time.trim() || '', // Empty string will be handled by updateEvent
        location: formData.location,
        price: formData.price,
        description: formData.description.trim() || '', // Empty string will be handled by updateEvent
        image: formData.image.trim() || '', // Empty string will be handled by updateEvent
        category: formData.category,
        contactEmail: formData.contactEmail.trim() || '',
        contactPhone: formData.contactPhone.trim() || '',
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

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as EventCategory })}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
              >
                <option value="tournament">Tournament</option>
                <option value="event">Event</option>
                <option value="workshop">Workshop</option>
                <option value="simul">Simul (Simultaneous Exhibition)</option>
                <option value="other">Other</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select the type of event. Tournaments are competitive chess competitions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                />
                <p className="mt-1 text-xs text-gray-500">Or enter as text: March 15-17, 2024</p>
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                  placeholder="e.g., March 15-17, 2024"
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  Time (Optional)
                </label>
                <input
                  id="time"
                  type="text"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="e.g., 10:00 AM - 5:00 PM or 9:00 AM"
                />
              </div>
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
                placeholder="e.g., Charlotte Convention Center, Charlotte, NC"
              />
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
                Event Flyer Image
              </label>
              <div className="space-y-4">
                <div>
                  <input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="image"
                    className={`inline-flex items-center px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      uploadingImage
                        ? 'border-gray-300 bg-gray-50'
                        : 'border-orange-300 hover:border-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    {uploadingImage ? (
                      <span className="text-gray-600">Uploading...</span>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-gray-700 font-medium">Upload New Flyer Image</span>
                      </>
                    )}
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    Recommended: JPG, PNG, or WebP. Max size: 5MB
                  </p>
                </div>

                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Flyer preview"
                      className="w-full max-w-md h-auto rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition"
                      aria-label="Remove image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Or enter image URL:</p>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <p className="text-sm text-gray-500 mb-4">Provide contact details for participants to reach out with questions.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    placeholder="contact@example.com"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email for event inquiries</p>
                </div>
                <div>
                  <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    placeholder="(704) 123-4567"
                  />
                  <p className="mt-1 text-xs text-gray-500">Phone number for event inquiries</p>
                </div>
              </div>
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

