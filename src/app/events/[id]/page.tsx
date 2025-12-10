'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEvent, getTournamentRegistrations, getUserRegistration } from '@/lib/events';
import { EventData, TournamentRegistration } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { registerUserForEvent, unregisterUserFromEvent, saveEvent, unsaveEvent } from '@/lib/events';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import RegistrationForm from '@/components/tournaments/RegistrationForm';
import TournamentOverviewCard from '@/components/tournament/TournamentOverviewCard';
import AboutTournamentCard from '@/components/tournament/AboutTournamentCard';
import EventDetailsCard from '@/components/tournament/EventDetailsCard';
import PriceSection from '@/components/tournament/PriceSection';
import RegisteredPlayersSection from '@/components/tournament/RegisteredPlayersSection';
import RulesAccordion from '@/components/tournament/RulesAccordion';
import ContactOrganizerCard from '@/components/tournament/ContactOrganizerCard';
import QuickInfoCard from '@/components/tournament/QuickInfoCard';
import RegisterPanel from '@/components/tournament/RegisterPanel';
import Link from 'next/link';

function EventDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const eventId = params.id as string;
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [userRegistration, setUserRegistration] = useState<TournamentRegistration | null>(null);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  useEffect(() => {
    if (user && eventId && event?.category === 'tournament') {
      loadRegistrations();
    }
  }, [user, eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const eventData = await getEvent(eventId);
      if (!eventData) {
        setError('Event not found');
        return;
      }
      setEvent(eventData);
      
      // Load registrations if it's a tournament
      if (eventData.category === 'tournament') {
        await loadRegistrations();
      }
    } catch (err: any) {
      console.error('Error loading event:', err);
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async () => {
    if (!eventId) return;
    try {
      setLoadingRegistrations(true);
      const regs = await getTournamentRegistrations(eventId);
      setRegistrations(regs);
      
      // Check if current user has a registration
      if (user) {
        const userReg = await getUserRegistration(eventId, user.uid);
        setUserRegistration(userReg);
      }
    } catch (err: any) {
      console.error('Error loading registrations:', err);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/events/${eventId}`));
      return;
    }

    if (!event) return;

    // For tournaments, show the registration form (only for logged-in users)
    if (event.category === 'tournament') {
      if (!user) {
        router.push('/login?redirect=' + encodeURIComponent(`/events/${eventId}`));
        return;
      }
      setShowRegistrationForm(true);
      return;
    }

    // For regular events, use the simple registration
    setRegistering(true);
    setError('');

    try {
      if (event.registeredUsers?.includes(user.uid)) {
        await unregisterUserFromEvent(eventId, user.uid);
      } else {
        await registerUserForEvent(eventId, user.uid);
      }
      // Reload event to get latest state from Firestore
      await loadEvent();
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register for event. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  const handleRegistrationComplete = async () => {
    setShowRegistrationForm(false);
    await loadRegistrations();
    await loadEvent();
  };

  const handleSave = async () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/events/${eventId}`));
      return;
    }

    if (!event) return;

    setSaving(true);
    setError('');

    try {
      if (event.savedByUsers?.includes(user.uid)) {
        await unsaveEvent(eventId, user.uid);
      } else {
        await saveEvent(eventId, user.uid);
      }
      // Reload event to get latest state from Firestore
      await loadEvent();
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isRegistered = !!(user && (event?.registeredUsers?.includes(user.uid) || userRegistration !== null));
  const isSaved = !!(user && event?.savedByUsers?.includes(user.uid));

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              href="/all"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-semibold transition inline-block"
            >
              Back to Events
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const formatPrice = (priceStr: string) => {
    if (!priceStr) return 'Free';
    if (!/^[\$£€¥₹]/.test(priceStr.trim())) {
      const numPrice = parseFloat(priceStr.trim());
      if (!isNaN(numPrice)) {
        return `$${numPrice.toFixed(2)}`;
      }
    }
    return priceStr;
  };

  // Get the price to display - prefer sections entry fees, then base price
  const getDisplayPrice = () => {
    // For tournaments, check if sections have entry fees
    if (event.category === 'tournament' && event.sections && event.sections.length > 0) {
      const sectionsWithFee = event.sections.filter(s => s.entryFee !== null && s.entryFee !== undefined);
      if (sectionsWithFee.length > 0) {
        // If all sections have the same fee, show that. Otherwise show range
        const fees = sectionsWithFee.map(s => s.entryFee!);
        const minFee = Math.min(...fees);
        const maxFee = Math.max(...fees);
        if (minFee === maxFee) {
          return `$${minFee.toFixed(2)}`;
        } else {
          return `$${minFee.toFixed(2)} - $${maxFee.toFixed(2)}`;
        }
      }
    }
    // Fall back to base price
    return formatPrice(event.price || '');
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-white chess-themed-bg">
      <Header />
      
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Hero Section with Large Image */}
      <div className="relative w-full">
        {event.image ? (
          <div className="w-full h-[450px] sm:h-[550px] lg:h-[650px] overflow-hidden relative">
            <img 
              src={event.image} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            
            {/* Back Button - Top Left */}
            <Link
              href={event.category === 'tournament' ? '/tournaments' : '/events'}
              className="absolute top-6 left-6 inline-flex items-center px-4 py-2.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg transition shadow-xl backdrop-blur-sm font-medium z-10"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            
            {/* Category Badge - Top Right */}
            <div className="absolute top-6 right-6 z-10">
              <span className="px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-bold capitalize shadow-xl">
                {event.category}
              </span>
            </div>
            
            {/* Title and Info Overlay - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 lg:p-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl leading-tight">
                {event.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-white/95">
                <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">
                    {event.category === 'tournament' && event.startDate && event.endDate ? (
                      (() => {
                        const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
                        const endDate = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);
                        const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
                      })()
                    ) : formatDate(event.date)}
                  </span>
                </div>
                {event.category === 'tournament' && event.timeControl && (
                  <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{event.timeControl}</span>
                  </div>
                )}
                {event.time && (
                  <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{event.time}</span>
                  </div>
                )}
                <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">
                    {event.category === 'tournament' && event.venue ? event.venue : event.location}
                  </span>
                </div>
                <div className="flex items-center bg-orange-500/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-lg">{getDisplayPrice()}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-[400px] sm:h-[500px] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">{event.title}</h1>
                <div className="flex flex-wrap justify-center gap-4 text-white/90">
                  <span className="font-semibold">
                    {event.category === 'tournament' && event.startDate && event.endDate ? (
                      (() => {
                        const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
                        const endDate = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);
                        const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
                      })()
                    ) : formatDate(event.date)}
                  </span>
                  {event.time && <span>• {event.time}</span>}
                  <span>• {event.category === 'tournament' && event.venue ? event.venue : event.location}</span>
                  {event.category === 'tournament' && event.timeControl && <span>• {event.timeControl}</span>}
                </div>
              </div>
            </div>
            <Link
              href={event.category === 'tournament' ? '/tournaments' : '/events'}
              className="absolute top-6 left-6 inline-flex items-center px-4 py-2.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg transition shadow-xl font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
          </div>
        )}
      </div>

      {/* Registration Form Modal - Only show if user is logged in */}
      {showRegistrationForm && event && user && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl">
            <button
              onClick={() => setShowRegistrationForm(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <RegistrationForm
              event={event}
              onRegistrationComplete={handleRegistrationComplete}
              onCancel={() => setShowRegistrationForm(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8 lg:gap-12">
          {/* Left Column - Main Content (65% width) */}
          <div className="space-y-10">
            {/* 1. Tournament Overview Card */}
            {event.category === 'tournament' && (
              <TournamentOverviewCard event={event} />
            )}

            {/* 2. About This Tournament Card */}
            {event.description && (
              <AboutTournamentCard 
                description={event.description}
                eventName={event.title}
              />
            )}

            {/* 3. Event Details Card */}
            <EventDetailsCard event={event} />

            {/* 4. Price Section */}
            <PriceSection event={event} />

            {/* 5. Registered Players Section */}
            {event.category === 'tournament' && (
              <>
                {loadingRegistrations ? (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7A00]"></div>
                      <p className="ml-3 text-gray-600">Loading players...</p>
                    </div>
                  </div>
                ) : (
                  <RegisteredPlayersSection
                    registrations={registrations}
                    sections={event.sections}
                  />
                )}
              </>
            )}

            {/* 6. Rules & Regulations Section */}
            {event.category === 'tournament' && (
              <RulesAccordion event={event} />
            )}
          </div>

          {/* Right Column - Sticky Sidebar (35% width) */}
          <div>
            <div className="sticky top-24 space-y-10">
              {/* Register Panel */}
              <RegisterPanel
                event={event}
                isRegistered={isRegistered}
                isSaved={isSaved}
                registering={registering}
                saving={saving}
                onRegister={handleRegister}
                onSave={handleSave}
                user={user}
                router={router}
                eventId={eventId}
              />

              {/* Quick Info Card */}
              <QuickInfoCard
                event={event}
                registrationsCount={registrations.length || event.registeredUsers?.length || 0}
              />

              {/* Contact Organizer Card */}
              {(event.contactEmail || event.contactPhone) && (
                <ContactOrganizerCard event={event} />
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function EventDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <EventDetailContent />
    </Suspense>
  );
}
