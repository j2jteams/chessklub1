'use client';

import { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showRegistrationForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // Cleanup: restore scroll when component unmounts
    return () => {
      document.body.style.overflow = '';
    };
  }, [showRegistrationForm]);

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
      <div className="min-h-screen bg-white chess-themed-bg">
        <Header />
        {/* Hero Skeleton */}
        <div className="w-full h-[450px] sm:h-[550px] lg:h-[650px] bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse rounded-b-3xl"></div>
        
        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-8 lg:gap-12">
            {/* Left Column Skeleton */}
            <div className="space-y-10">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ))}
            </div>
            
            {/* Right Column Skeleton */}
            <div>
              <div className="sticky top-24">
                <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                  <div className="h-12 bg-gray-200 rounded-full w-32 mx-auto mb-6"></div>
                  <div className="h-20 bg-gray-200 rounded-lg mb-6"></div>
                  <div className="h-12 bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-12 bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-12 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
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

  const formatTime = (timeStr: string) => {
    // Try to parse and format time string
    if (!timeStr) return '';
    // If it's already formatted (e.g., "9:56 PM"), return as is
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
    // Otherwise try to format it
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes || '00'} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const getHeroSummary = () => {
    const parts: string[] = [];
    
    // Date
    if (event.category === 'tournament' && event.startDate) {
      const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
      parts.push(formatDate(startDate.toISOString()));
    } else if (event.date) {
      parts.push(formatDate(event.date));
    }
    
    // Time range
    if (event.startTime && event.endTime) {
      parts.push(`${formatTime(event.startTime)} – ${formatTime(event.endTime)}`);
    } else if (event.time) {
      parts.push(event.time);
    }
    
    // Format/Time Control
    const tc = event.timeControl;
    if (tc) {
      let timeControlLabel: string | null = null;
      if (typeof tc === 'object' && 'category' in tc) {
        // New format: TimeControl object
        const timeControl = tc as any;
        timeControlLabel = timeControl.customLabel?.trim() || 
                          timeControl.format?.trim() || 
                          timeControl.category || 
                          null;
      } else if (typeof tc === 'string') {
        // Legacy format: string
        timeControlLabel = tc;
      }
      if (timeControlLabel) {
        parts.push(timeControlLabel);
      }
    }
    
    // Mode of play - Default to In-person if coordinates or venue exists, otherwise Online
    const hasLocation = event.coordinates || event.venue || (event.location && !event.location.toLowerCase().includes('online'));
    const venueType = event.venueType || (hasLocation ? 'In-person' : 'Online');
    parts.push(venueType);
    
    return parts.join(' • ');
  };

  const getHeroBadges = () => {
    const badges: Array<{ label: string; color: string }> = [];
    
    // Check if created within last 7 days
    if (event.createdAt) {
      const createdDate = event.createdAt instanceof Date ? event.createdAt : new Date(event.createdAt);
      const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation <= 7) {
        badges.push({ label: 'New', color: 'bg-green-500' });
      }
    }
    
    // FIDE Rated
    if (event.fideRated) {
      badges.push({ label: 'Rated', color: 'bg-blue-500' });
    }
    
    // Mode of play - Default to In-person if coordinates or venue exists, otherwise Online
    const hasLocation = event.coordinates || event.venue || (event.location && !event.location.toLowerCase().includes('online'));
    const venueType = event.venueType || (hasLocation ? 'In-person' : 'Online');
    badges.push({ 
      label: venueType, 
      color: venueType === 'Online' ? 'bg-indigo-500' : 'bg-gray-600' 
    });
    
    // Free
    const price = getDisplayPrice();
    if (price === 'Free' || price === '$0.00') {
      badges.push({ label: 'Free', color: 'bg-orange-500' });
    }
    
    return badges;
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
      <div className="relative w-full rounded-b-3xl shadow-md overflow-hidden">
        {event.image || event.heroImageUrl ? (
          <div className="w-full h-[450px] sm:h-[550px] lg:h-[650px] overflow-hidden relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
            <img 
              src={event.heroImageUrl || event.image} 
              alt={event.title || event.name}
              className="w-full h-full object-cover object-center"
              style={{ objectPosition: 'center center' }}
            />
            {/* Gradient Overlay for better text readability - Darker for better contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20"></div>
            
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
            
            {/* Badges - Top Right */}
            <div className="absolute top-6 right-6 z-10 flex flex-wrap gap-2 justify-end">
              {getHeroBadges().map((badge, idx) => (
                <span
                  key={idx}
                  className={`${badge.color} text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg`}
                >
                  {badge.label}
              </span>
              ))}
            </div>
            
            {/* Title and Info Overlay - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 py-10 sm:py-12 lg:py-16 px-8 sm:px-12 lg:px-16">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-2xl leading-tight" style={{ color: '#ffffff', textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
                {event.title || event.name}
              </h1>
              
              {/* Summary Line */}
              <p className="text-lg sm:text-xl mb-4 drop-shadow-lg" style={{ color: '#ffffff', textShadow: '1px 1px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)' }}>
                {getHeroSummary()}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-[400px] sm:h-[500px] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 relative">
            {/* Back Button - Top Left */}
            <Link
              href={event.category === 'tournament' ? '/tournaments' : '/events'}
              className="absolute top-6 left-6 inline-flex items-center px-4 py-2.5 bg-white/95 hover:bg-white text-gray-800 rounded-lg transition shadow-xl font-medium z-10"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            
            {/* Badges - Top Right */}
            <div className="absolute top-6 right-6 z-10 flex flex-wrap gap-2 justify-end">
              {getHeroBadges().map((badge, idx) => (
                <span
                  key={idx}
                  className={`${badge.color} text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
            
            {/* Content - Centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-2xl" style={{ color: '#ffffff', textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
                  {event.title || event.name}
                </h1>
                <p className="text-lg sm:text-xl drop-shadow-lg" style={{ color: '#ffffff', textShadow: '1px 1px 4px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.5)' }}>
                  {getHeroSummary()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Registration Form Modal - Only show if user is logged in */}
      {showRegistrationForm && event && user && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            // Close modal when clicking backdrop
            if (e.target === e.currentTarget) {
              setShowRegistrationForm(false);
            }
          }}
        >
          <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowRegistrationForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition z-10 bg-white rounded-full p-1 shadow-sm"
              aria-label="Close registration form"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <RegistrationForm
              event={event}
              onRegistrationComplete={handleRegistrationComplete}
              onCancel={() => setShowRegistrationForm(false)}
            />
          </div>
        </div>,
        document.body
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
            <AboutTournamentCard 
              description={event.description || ''}
              eventName={event.title || event.name || ''}
            />

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
                registrationsCount={registrations.length}
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
