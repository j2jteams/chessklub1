'use client';

import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EventsSection from "@/components/EventsSection";
import { getApprovedEvents } from "@/lib/events";
import { EventData } from "@/lib/types";
import Link from "next/link";

export default function Page() {
  const [allTournaments, setAllTournaments] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        const allEvents = await getApprovedEvents();
        const now = new Date();

        // Get all future events (both current and upcoming)
        const futureEvents: EventData[] = [];

        allEvents.forEach((event) => {
          try {
            const eventDate = new Date(event.date);
            if (isNaN(eventDate.getTime())) return; // Skip invalid dates

            // Include all future events
            if (eventDate >= now) {
              futureEvents.push(event);
            }
          } catch (error) {
            console.error('Error parsing date for event:', event.id, error);
          }
        });

        // Sort by date
        futureEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setAllTournaments(futureEvents);
      } catch (error) {
        console.error('Error fetching tournaments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);
  return (
    <main className="min-h-screen chess-themed-bg" style={{ backgroundColor: 'var(--color-light)' }}>
      <Header />

      {/* Hero Section */}
      <section 
        className="relative overflow-hidden text-center"
        style={{ 
          backgroundColor: 'var(--color-dark)',
          paddingTop: 'var(--space-md)',
          paddingBottom: 'var(--space-md)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Banner Logo */}
          <div className="mb-4 flex justify-center w-full">
            <img 
              src="/CK banner logo Enhanced.png" 
              alt="Chess Klub Banner" 
              className="w-full max-w-3xl h-auto object-contain"
            />
          </div>
          <h1 
            className="mb-3 font-bold"
            style={{ 
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              color: 'var(--color-light)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Master Chess. Join the Klub.
          </h1>
          <p 
            className="mb-6 text-base"
            style={{ 
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: 'var(--font-body)'
            }}
          >
            Compete in tournaments, learn from expert tutors, and connect with chess enthusiasts
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/tournaments"
              className="text-white font-semibold transition shadow-lg py-2.5 px-5 rounded hover:opacity-90 text-center text-sm"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              Browse Tournaments
            </Link>
            <button 
              className="font-semibold transition py-2.5 px-5 rounded hover:bg-white hover:bg-opacity-10 text-sm"
              style={{ 
                backgroundColor: 'transparent',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                color: 'var(--color-light)'
              }}
            >
              Find a Tutor
            </button>
          </div>
        </div>
      </section>

      {/* Events Section with Carousel */}
      <EventsSection tournaments={allTournaments} loading={loading} />

      {/* Tutoring Section */}
      <section 
        id="tutoring"
        style={{
          backgroundColor: 'var(--color-medium)',
          paddingTop: 'var(--space-lg)',
          paddingBottom: 'var(--space-lg)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 
            className="mb-8 text-center font-bold"
            style={{ 
              fontSize: 'var(--font-size-h2)',
              color: 'var(--color-dark)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Expert Chess Tutoring
          </h2>
          <p 
            className="text-center mb-12 max-w-3xl mx-auto"
            style={{ 
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-gray)',
              fontFamily: 'var(--font-body)'
            }}
          >
            Learn from experienced masters. Choose between in-person or online sessions tailored to your skill level.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* In-Person Tutoring */}
            <div 
              className="rounded-lg shadow-lg p-8"
              style={{ backgroundColor: 'var(--color-light)' }}
            >
              <div className="flex items-center mb-6">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mr-4"
                  style={{ backgroundColor: 'var(--color-dark)' }}
                >
                  <span className="text-white text-2xl">👨‍🏫</span>
                </div>
                <h3 
                  className="font-bold"
                  style={{ 
                    fontSize: '1.5rem',
                    color: 'var(--color-dark)',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  In-Person Tutoring
                </h3>
              </div>
              <p 
                className="mb-6"
                style={{ 
                  color: 'var(--color-gray)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                Meet with certified chess instructors at our local centers. Personalized one-on-one or group sessions available.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <span 
                    className="mr-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    ✓
                  </span>
                  <span style={{ color: 'var(--color-dark)' }}>Face-to-face instruction</span>
                </div>
                <div className="flex items-center">
                  <span 
                    className="mr-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    ✓
                  </span>
                  <span style={{ color: 'var(--color-dark)' }}>Physical board practice</span>
                </div>
                <div className="flex items-center">
                  <span 
                    className="mr-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    ✓
                  </span>
                  <span style={{ color: 'var(--color-dark)' }}>Flexible scheduling</span>
                </div>
              </div>
              <button 
                className="w-full text-white py-3 rounded font-semibold transition"
                style={{ backgroundColor: 'var(--color-dark)' }}
              >
                Find In-Person Tutors
              </button>
            </div>

            {/* Online Tutoring */}
            <div 
              className="rounded-lg shadow-lg p-8"
              style={{ backgroundColor: 'var(--color-light)' }}
            >
              <div className="flex items-center mb-6">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mr-4"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  <span className="text-white text-2xl">💻</span>
                </div>
                <h3 
                  className="font-bold"
                  style={{ 
                    fontSize: '1.5rem',
                    color: 'var(--color-dark)',
                    fontFamily: 'var(--font-heading)'
                  }}
                >
                  Online Tutoring
                </h3>
              </div>
              <p 
                className="mb-6"
                style={{ 
                  color: 'var(--color-gray)',
                  fontFamily: 'var(--font-body)'
                }}
              >
                Learn from anywhere! Interactive online sessions with top-rated chess coaches. Perfect for busy schedules.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <span 
                    className="mr-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    ✓
                  </span>
                  <span style={{ color: 'var(--color-dark)' }}>Learn from home</span>
                </div>
                <div className="flex items-center">
                  <span 
                    className="mr-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    ✓
                  </span>
                  <span style={{ color: 'var(--color-dark)' }}>Interactive digital boards</span>
                </div>
                <div className="flex items-center">
                  <span 
                    className="mr-2"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    ✓
                  </span>
                  <span style={{ color: 'var(--color-dark)' }}>Recorded sessions</span>
                </div>
              </div>
              <button 
                className="w-full text-white py-3 rounded font-semibold transition"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                Find Online Tutors
              </button>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section 
        style={{
          backgroundColor: 'var(--color-dark)',
          paddingTop: 'var(--space-lg)',
          paddingBottom: 'var(--space-lg)'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 
            className="mb-6 font-bold"
            style={{ 
              fontSize: 'var(--font-size-h2)',
              color: 'var(--color-light)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Ready to Elevate Your Game?
          </h2>
          <p 
            className="mb-8"
            style={{ 
              fontSize: 'var(--font-size-body)',
              color: 'var(--color-light)',
              fontFamily: 'var(--font-body)'
            }}
          >
            Join thousands of players improving their skills and competing in exciting tournaments
          </p>
          <button 
            className="text-white font-semibold transition shadow-lg px-10 py-4 rounded"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            Get Started Today
          </button>
        </div>
      </section>

      <Footer />
    </main>
  );
}