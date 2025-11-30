'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getEvent } from '@/lib/events';
import { EventData } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { registerUserForEvent, unregisterUserFromEvent, saveEvent, unsaveEvent } from '@/lib/events';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const eventData = await getEvent(eventId);
      if (!eventData) {
        setError('Event not found');
        return;
      }
      setEvent(eventData);
    } catch (err: any) {
      console.error('Error loading event:', err);
      setError(err.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/events/${eventId}`));
      return;
    }

    if (!event) return;

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

  const isRegistered = user && event?.registeredUsers?.includes(user.uid);
  const isSaved = user && event?.savedByUsers?.includes(user.uid);

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

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left Column - Main Content (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            {event.description && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">About This {event.category === 'tournament' ? 'Tournament' : 'Event'}</h2>
                <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                  {event.description}
                </div>
              </div>
            )}

            {/* Event Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Details</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Date & Time</h3>
                    <p className="text-gray-700">
                      {event.category === 'tournament' && event.startDate && event.endDate ? (
                        (() => {
                          const startDate = event.startDate instanceof Date ? event.startDate : new Date(event.startDate);
                          const endDate = event.endDate instanceof Date ? event.endDate : new Date(event.endDate);
                          const startStr = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                          const endStr = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                          return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
                        })()
                      ) : formatDate(event.date)}
                    </p>
                    {event.time && <p className="text-gray-600 text-sm mt-1">{event.time}</p>}
                    {event.category === 'tournament' && event.timeControl && (
                      <p className="text-gray-600 text-sm mt-1">Time Control: {event.timeControl}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                    <p className="text-gray-700">
                      {event.category === 'tournament' && event.venue ? event.venue : event.location}
                    </p>
                  </div>
                </div>
                
                {/* Tournament Sections */}
                {event.category === 'tournament' && event.sections && event.sections.length > 0 && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Tournament Sections</h3>
                      <div className="space-y-2">
                        {event.sections.map((section, index) => (
                          <div key={section.id || index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{section.name}</span>
                              {section.entryFee !== null && section.entryFee !== undefined && (
                                <span className="text-orange-600 font-semibold">
                                  ${section.entryFee.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {(section.minRating !== null || section.maxRating !== null) && (
                              <p className="text-sm text-gray-600 mt-1">
                                Rating: {section.minRating !== null ? `U${section.minRating}` : 'Open'}
                                {section.minRating !== null && section.maxRating !== null && ' - '}
                                {section.maxRating !== null && section.minRating === null && 'U'}
                                {section.maxRating !== null && `U${section.maxRating}`}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Add-Ons (for all event types) */}
                {event.addOns && event.addOns.length > 0 && (
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">Add-Ons</h3>
                      <div className="space-y-2">
                        {event.addOns.map((addOn, index) => (
                          <div key={addOn.id || index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{addOn.name}</span>
                                  {addOn.isRequired && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                                {addOn.description && (
                                  <p className="text-sm text-gray-600 mt-1">{addOn.description}</p>
                                )}
                                {addOn.appliesToSections && addOn.appliesToSections.length > 0 && event.sections && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Applies to: {addOn.appliesToSections.map(sectionId => {
                                      const section = event.sections?.find(s => s.id === sectionId);
                                      return section?.name || sectionId;
                                    }).join(', ')}
                                  </p>
                                )}
                              </div>
                              {addOn.price !== null && addOn.price !== undefined && (
                                <span className="text-orange-600 font-semibold ml-4">
                                  ${addOn.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Price</h3>
                    <p className="text-2xl font-bold text-orange-600">{getDisplayPrice()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {(event.contactEmail || event.contactPhone) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                <div className="space-y-4">
                  {event.contactEmail && (
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <a 
                          href={`mailto:${event.contactEmail}`}
                          className="text-orange-600 hover:text-orange-700 font-semibold text-lg"
                        >
                          {event.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  {event.contactPhone && (
                    <div className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Phone</p>
                        <a 
                          href={`tel:${event.contactPhone.replace(/\D/g, '')}`}
                          className="text-orange-600 hover:text-orange-700 font-semibold text-lg"
                        >
                          {event.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sticky Sidebar (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {/* Registration Card */}
              <div className="bg-white rounded-xl shadow-xl border-2 border-gray-200 p-6 mb-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-orange-600 mb-2">{getDisplayPrice()}</div>
                  <p className="text-gray-600 text-sm">
                    {event.category === 'tournament' && event.sections && event.sections.length > 0
                      ? 'per section'
                      : `per ${event.category === 'tournament' ? 'tournament' : 'event'}`}
                  </p>
                </div>

                {/* Registration Count */}
                {event.registeredUsers && event.registeredUsers.length > 0 && (
                  <div className="mb-6 p-3 bg-orange-50 rounded-lg text-center">
                    <p className="text-sm text-gray-700">
                      <span className="font-bold text-orange-600">{event.registeredUsers.length}</span> {event.registeredUsers.length === 1 ? 'person' : 'people'} registered
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleRegister}
                    disabled={registering || event.status !== 'approved'}
                    className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition shadow-lg ${
                      isRegistered
                        ? 'bg-gray-500 hover:bg-gray-600 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {registering ? 'Processing...' : isRegistered ? '✓ Registered' : 'Register Now'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full px-6 py-3 rounded-lg font-semibold transition border-2 ${
                      isSaved
                        ? 'bg-orange-50 border-orange-500 text-orange-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-orange-500 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {saving ? 'Saving...' : isSaved ? '✓ Saved' : 'Save for Later'}
                  </button>
                </div>

                {!user && (
                  <p className="text-xs text-gray-500 text-center mt-4">
                    <Link href={`/login?redirect=${encodeURIComponent(`/events/${eventId}`)}`} className="text-orange-600 hover:underline">
                      Sign in
                    </Link> to register
                  </p>
                )}
              </div>

              {/* Quick Info Card */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-semibold text-gray-900 capitalize">{event.category}</span>
                  </div>
                  {/* Only show status to admins and owners */}
                  {(role === 'admin' || role === 'owner') && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-semibold ${event.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {event.status}
                      </span>
                    </div>
                  )}
                  {event.registeredUsers && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registrations:</span>
                      <span className="font-semibold text-gray-900">{event.registeredUsers.length}</span>
                    </div>
                  )}
                </div>
              </div>
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
