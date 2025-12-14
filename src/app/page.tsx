'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getApprovedEvents } from "@/lib/events";
import { EventData } from "@/lib/types";
import HeroSearchSection from "@/components/landing/HeroSearchSection";
import TournamentCategoryChips from "@/components/landing/TournamentCategoryChips";
import FeaturedTournamentsCarousel from "@/components/landing/FeaturedTournamentsCarousel";
import UpcomingTournamentsGrid from "@/components/landing/UpcomingTournamentsGrid";
import HowItWorks from "@/components/landing/HowItWorks";
import AboutSection from "@/components/landing/AboutSection";
import FinalCTA from "@/components/landing/FinalCTA";

export default function Page() {
  const [allTournaments, setAllTournaments] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
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
      } catch (error) {
        console.error('Error fetching tournaments:', error);
        setAllTournaments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero Section with Search */}
      <HeroSearchSection />

      {/* Category Filter Chips */}
      <TournamentCategoryChips />

      {/* Featured Tournaments Carousel */}
      <FeaturedTournamentsCarousel tournaments={allTournaments} loading={loading} />

      {/* Upcoming Tournaments Grid */}
      <UpcomingTournamentsGrid tournaments={allTournaments} loading={loading} />

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
