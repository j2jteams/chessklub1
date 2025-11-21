'use client';

import { useState } from 'react';
import Link from 'next/link';
import EventCard from './EventCard';
import { EventData } from '@/lib/types';

interface EventsSectionProps {
  tournaments?: EventData[];
  loading?: boolean;
}

// Placeholder tournaments for demo purposes
const PLACEHOLDER_TOURNAMENTS = [
  {
    title: "Summer Chess Championship",
    date: "July 20, 2025",
    location: "Charlotte Convention Center",
    price: "$50",
    description: "Annual summer championship for all ages. Multiple categories available."
  },
  {
    title: "Beginner Friendly Tournament",
    date: "August 10, 2025",
    location: "Online (Chess.com)",
    price: "Free",
    description: "A great starting point for new players. Learn and compete in a supportive environment."
  },
  {
    title: "Fall Scholastic Open",
    date: "September 15, 2025",
    location: "Ballantyne Chess Klub",
    price: "$30",
    description: "Tournament for school-aged children. Build skills and make friends."
  },
  {
    title: "Winter Blitz Challenge",
    date: "December 1, 2025",
    location: "Online (Lichess.org)",
    price: "$10",
    description: "Fast-paced blitz tournament. 5-minute games for the ultimate chess challenge."
  },
  {
    title: "Grandmaster Simul",
    date: "October 20, 2025",
    location: "Charlotte City Club",
    price: "$100",
    description: "Play against a Grandmaster! Experience high-level chess competition."
  },
  {
    title: "Rapid Chess Open",
    date: "November 5, 2025",
    location: "Fort Mill, SC",
    price: "$75",
    description: "Rapid time control tournament. Perfect for players who enjoy faster games."
  },
];

export default function EventsSection({ tournaments = [], loading = false }: EventsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 4; // Desktop default

  // Use placeholder data if no tournaments are provided
  const displayTournaments = tournaments.length > 0 
    ? tournaments 
    : PLACEHOLDER_TOURNAMENTS.map((t, index) => ({
        id: `placeholder-${index}`,
        title: t.title,
        date: t.date,
        location: t.location,
        price: t.price,
        description: t.description,
        status: 'approved' as const,
        createdBy: 'system',
        createdByEmail: 'admin@chessklub.com',
        registeredUsers: [],
        savedByUsers: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

  // Convert EventData to EventCard format
  const events = displayTournaments.map((tournament) => ({
    title: tournament.title,
    date: tournament.date,
    location: tournament.location,
    price: tournament.price,
    description: tournament.description,
  }));

  const maxIndex = Math.max(0, events.length - itemsPerView);

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev >= maxIndex ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev <= 0 ? maxIndex : prev - 1
    );
  };

  return (
    <section 
      id="events" 
      className="bg-white"
      style={{
        paddingTop: 'var(--space-lg)',
        paddingBottom: 'var(--space-lg)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 
            className="font-bold"
            style={{ 
              fontSize: 'var(--font-size-h2)',
              color: 'var(--color-dark)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Upcoming Events and Tournaments
          </h2>
          <Link
            href="/tournaments"
            className="text-sm font-semibold hover:opacity-80 transition"
            style={{ color: 'var(--color-accent)' }}
          >
            View All →
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'var(--color-accent)' }}></div>
            <p className="mt-4" style={{ color: 'var(--color-gray)' }}>Loading tournaments...</p>
          </div>
        ) : (
          /* Carousel Container */
          <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-3 shadow-lg transition"
            style={{
              backgroundColor: 'var(--color-light)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent)';
              e.currentTarget.style.color = 'var(--color-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-light)';
              e.currentTarget.style.color = 'var(--color-dark)';
            }}
            aria-label="Previous events"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-3 shadow-lg transition"
            style={{
              backgroundColor: 'var(--color-light)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent)';
              e.currentTarget.style.color = 'var(--color-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-light)';
              e.currentTarget.style.color = 'var(--color-dark)';
            }}
            aria-label="Next events"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Events Carousel */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out gap-6"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              }}
            >
              {events.map((event, index) => (
                <div 
                  key={index} 
                  className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4 px-3"
                >
                  <EventCard {...event} />
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: Math.ceil(events.length / itemsPerView) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * itemsPerView)}
                className="w-2 h-2 rounded-full transition"
                style={{
                  width: Math.floor(currentIndex / itemsPerView) === index ? '2rem' : '0.5rem',
                  backgroundColor: Math.floor(currentIndex / itemsPerView) === index 
                    ? 'var(--color-accent)' 
                    : 'var(--color-gray)'
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
        )}
      </div>
    </section>
  );
}

