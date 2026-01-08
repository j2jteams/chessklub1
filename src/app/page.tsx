'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getApprovedEvents } from "@/lib/events";
import { EventData } from "@/lib/types";
import HeroSearchSection from "@/components/landing/HeroSearchSection";
import FeaturedTournamentsCarousel from "@/components/landing/FeaturedTournamentsCarousel";
import UpcomingTournamentsGrid from "@/components/landing/UpcomingTournamentsGrid";
import HowItWorks from "@/components/landing/HowItWorks";
import AboutSection from "@/components/landing/AboutSection";
import FinalCTA from "@/components/landing/FinalCTA";
import LocationPermissionPrompt from "@/components/tournaments/LocationPermissionPrompt";
import { getUserLocation, getCountryFromCoordinates } from '@/lib/locationHelpers';

export default function Page() {
  const [allTournaments, setAllTournaments] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [autoLocationRequested, setAutoLocationRequested] = useState(false);

  const fetchTournaments = async () => {
    setLoading(true);
    setError(null);
    try {
      const allEvents = await getApprovedEvents();
      console.log('Fetched approved events:', allEvents.length);
      
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Get all events - be very lenient with filtering
      const validEvents: EventData[] = [];

      // Show ALL approved events for now - no date filtering
      // This ensures tournaments are visible regardless of date
      allEvents.forEach((event) => {
        validEvents.push(event);
      });

      console.log('Valid events after filtering:', validEvents.length);

      // Sort by date (events without dates go to end)
      validEvents.sort((a, b) => {
        const dateA = a.startDate || a.date;
        const dateB = b.startDate || b.date;
        
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        try {
          const dateAObj = dateA instanceof Date ? dateA : new Date(dateA);
          const dateBObj = dateB instanceof Date ? dateB : new Date(dateB);
          if (isNaN(dateAObj.getTime()) || isNaN(dateBObj.getTime())) return 0;
          return dateAObj.getTime() - dateBObj.getTime();
        } catch {
          return 0;
        }
      });

      setAllTournaments(validEvents);
      console.log('Set tournaments:', validEvents.length);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch tournaments');
      console.error('[tournaments] Error fetching tournaments:', error);
      setError(error);
      setAllTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  // No need to manage prompt visibility here - component handles it

  // Auto-request location on page load if user previously allowed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const shouldAutoRequest = localStorage.getItem('location-auto-request') === 'true';
    const hasBeenDenied = localStorage.getItem('location-permission-denied') === 'true';
    const hasStoredLocation = localStorage.getItem('user-location');
    
    console.log('🔄 Auto-request check:', { shouldAutoRequest, hasBeenDenied, hasStoredLocation });
    
    // Only request if user allowed but we don't have stored location yet
    if (shouldAutoRequest && !hasBeenDenied && !hasStoredLocation) {
      console.log('🔄 Auto-requesting location on page load...');
      getUserLocation()
        .then(async (location) => {
          console.log('✅ Auto-requested location:', location);
          localStorage.setItem('user-location', JSON.stringify(location));
          const countryInfo = await getCountryFromCoordinates(location.lat, location.lng);
          if (countryInfo) {
            localStorage.setItem('user-country', JSON.stringify(countryInfo));
            console.log('✅ Auto-saved country:', countryInfo);
          }
        })
        .catch((error) => {
          // Handle different error types
          let errorMessage = 'Unknown error';
          let errorCode = null;
          
          if (error) {
            errorMessage = error.message || error.toString() || JSON.stringify(error);
            errorCode = error.code;
          }
          
          // Use console.warn to avoid triggering Next.js error overlay
          console.warn('⚠️ Auto-location request failed (non-critical):', {
            message: errorMessage,
            code: errorCode,
            note: 'App will continue to work without location. User can manually enable location later.'
          });
          // Don't show alert for auto-request failures (user might not be on page)
        });
    } else {
      if (hasStoredLocation) {
        console.log('ℹ️ Location already stored, skipping auto-request');
      }
    }
  }, []);

  const handleLocationAllow = () => {
    console.log('✅ User clicked "Allow Location"');
    localStorage.setItem('location-auto-request', 'true');
    setAutoLocationRequested(true);
    // Request location immediately
    console.log('🌍 Requesting user location...');
    getUserLocation()
      .then(async (location) => {
        console.log('✅ Got user location:', location);
        localStorage.setItem('user-location', JSON.stringify(location));
        console.log('💾 Saved location to localStorage');
        
        console.log('🌍 Getting country from coordinates...');
        const countryInfo = await getCountryFromCoordinates(location.lat, location.lng);
        console.log('✅ Got country info:', countryInfo);
        
        if (countryInfo) {
          localStorage.setItem('user-country', JSON.stringify(countryInfo));
          console.log('💾 Saved country to localStorage');
        } else {
          console.warn('⚠️ No country info returned');
        }
        
        // Verify it was saved
        const saved = localStorage.getItem('user-location');
        console.log('🔍 Verification - location in localStorage:', saved ? 'SAVED ✅' : 'MISSING ❌');
      })
      .catch((error) => {
        console.error('❌ Error getting user location:', error);
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          name: error?.name
        });
        // Show user-friendly message
        alert('Unable to get your location. Please check your browser permissions and try again.');
      });
  };

  const handleLocationDeny = () => {
    setAutoLocationRequested(true);
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />
      {/* Location Permission Prompt - component manages its own visibility */}
      <LocationPermissionPrompt
        onAllow={handleLocationAllow}
        onDeny={handleLocationDeny}
      />

      {/* Hero Section with Search */}
      <HeroSearchSection />

      {/* Featured Tournaments Carousel */}
      <FeaturedTournamentsCarousel 
        tournaments={allTournaments} 
        loading={loading} 
        error={error}
        onRetry={fetchTournaments}
      />

      {/* Upcoming Tournaments Grid */}
      <UpcomingTournamentsGrid 
        tournaments={allTournaments} 
        loading={loading} 
        error={error}
        onRetry={fetchTournaments}
      />

      {/* How It Works */}
      <HowItWorks />

      {/* About Section */}
      <AboutSection />

      {/* Final CTA */}
      <FinalCTA />

      <Footer />
    </main>
  );
}
