'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EventData, TournamentSection, EventAddOn } from '@/lib/types';
import { createTournamentRegistration, getUserRegistration } from '@/lib/events';
import { useAuth } from '@/hooks/useAuth';

interface RegistrationFormProps {
  event: EventData;
  onRegistrationComplete: () => void;
  onCancel: () => void;
}

export default function RegistrationForm({ event, onRegistrationComplete, onCancel }: RegistrationFormProps) {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingRegistration, setExistingRegistration] = useState<any>(null);

  // Form state - Player Information
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Form state - Tournament Information
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [fideId, setFideId] = useState('');
  const [fideRating, setFideRating] = useState<number | ''>('');
  const [nationalFederationId, setNationalFederationId] = useState('');
  const [nationalRating, setNationalRating] = useState<number | ''>('');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`);
    }
  }, [user, authLoading, router, event.id]);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      // Set display name from profile or auth user
      const name = profile?.firstName && profile?.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : user.displayName || user.email?.split('@')[0] || '';
      setDisplayName(name);
      setEmail(user.email || '');
    }
  }, [user, profile]);

  useEffect(() => {
    if (user && event.id) {
      loadExistingRegistration();
    }
  }, [user, event.id]);

  const loadExistingRegistration = async () => {
    if (!user || !event.id) return;
    try {
      const registration = await getUserRegistration(event.id, user.uid);
      if (registration) {
        setExistingRegistration(registration);
        setDisplayName(registration.displayName || '');
        setEmail(registration.userEmail || user.email || '');
        setPhoneNumber(registration.phoneNumber || '');
        setSelectedSection(registration.sectionId || '');
        setFideId(registration.fideId || '');
        setFideRating(registration.fideRating || '');
        setNationalFederationId(registration.nationalFederationId || '');
        setNationalRating(registration.nationalRating || '');
        setSelectedAddOns(registration.selectedAddOns || []);
        setNotes(registration.notes || '');
      }
    } catch (err) {
      console.error('Error loading existing registration:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!displayName.trim()) {
        setError('Please enter your name');
        setLoading(false);
        return;
      }
      if (!email.trim()) {
        setError('Please enter your email');
        setLoading(false);
        return;
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }
      // Validate section selection if sections exist
      if (event.sections && event.sections.length > 0 && !selectedSection) {
        setError('Please select a section');
        setLoading(false);
        return;
      }

      // Validate event ID exists
      if (!event.id) {
        setError('Invalid event. Please refresh the page and try again.');
        setLoading(false);
        return;
      }

      const registrationData = {
        tournamentId: event.id,
        userId: user.uid,
        userEmail: email.trim(),
        displayName: displayName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        sectionId: selectedSection || undefined,
        fideId: fideId.trim() || undefined,
        fideRating: fideRating !== '' ? Number(fideRating) : undefined,
        nationalFederationId: nationalFederationId.trim() || undefined,
        nationalRating: nationalRating !== '' ? Number(nationalRating) : undefined,
        status: 'confirmed' as const,
        paymentStatus: 'pending' as const,
        selectedAddOns: selectedAddOns.length > 0 ? selectedAddOns : undefined,
        notes: notes.trim() || undefined,
      };

      await createTournamentRegistration(registrationData);
      onRegistrationComplete();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]
    );
  };

  const sections: TournamentSection[] = event.sections || [];
  const addOns: EventAddOn[] = event.addOns || [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Register for Tournament</h2>
        <p className="text-gray-600">{event.name}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {existingRegistration && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            You have an existing registration. Submitting will update your registration.
          </p>
        </div>
      )}

      {authLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="ml-3 text-gray-600">Loading...</p>
        </div>
      ) : !user ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Please sign in to register for this tournament.</p>
          <button
            onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`)}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition"
          >
            Sign In / Sign Up
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Player Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Player Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g., +1 (555) 123-4567"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Tournament Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Information</h3>
          </div>

          {/* Section Selection */}
          {sections.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Section <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            >
              <option value="">Choose a section...</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                  {section.minRating !== null && section.maxRating !== null
                    ? ` (Rating: ${section.minRating}-${section.maxRating})`
                    : section.minRating !== null
                    ? ` (Min Rating: ${section.minRating})`
                    : section.maxRating !== null
                    ? ` (Max Rating: ${section.maxRating})`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* FIDE Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">FIDE ID</label>
            <input
              type="text"
              value={fideId}
              onChange={(e) => setFideId(e.target.value)}
              placeholder="e.g., 12345678"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">FIDE Rating</label>
            <input
              type="number"
              value={fideRating}
              onChange={(e) => setFideRating(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g., 1800"
              min="0"
              max="3000"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* National Federation Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">National Federation ID</label>
            <input
              type="text"
              value={nationalFederationId}
              onChange={(e) => setNationalFederationId(e.target.value)}
              placeholder="e.g., USCF, ELO"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">National Rating</label>
            <input
              type="number"
              value={nationalRating}
              onChange={(e) => setNationalRating(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g., 1900"
              min="0"
              max="3000"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Add-ons */}
        {addOns.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Add-ons (Optional)</label>
            <div className="space-y-2">
              {addOns.map((addOn) => (
                <label key={addOn.id} className="flex items-center p-3 border-2 border-gray-200 rounded-lg hover:border-orange-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAddOns.includes(addOn.id)}
                    onChange={() => toggleAddOn(addOn.id)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <div className="ml-3 flex-1">
                    <span className="text-sm font-medium text-gray-900">{addOn.name}</span>
                    {addOn.description && (
                      <p className="text-xs text-gray-600 mt-0.5">{addOn.description}</p>
                    )}
                    {addOn.price !== undefined && addOn.price !== null && addOn.price > 0 && (
                      <p className="text-sm font-semibold text-orange-600 mt-1">${addOn.price.toFixed(2)}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special requests or information..."
            rows={3}
            className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : existingRegistration ? 'Update Registration' : 'Complete Registration'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}

