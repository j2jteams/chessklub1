'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [itemsPerView, setItemsPerView] = useState(1);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Calculate items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(3); // Desktop: 3 cards
      } else if (window.innerWidth >= 640) {
        setItemsPerView(2); // Tablet: 2 cards
      } else {
        setItemsPerView(1); // Mobile: 1 card
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

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
        image: undefined, // Placeholders don't have images
        category: 'tournament' as const,
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
    id: tournament.id,
    title: tournament.title,
    date: tournament.date,
    location: tournament.location,
    price: tournament.price,
    description: tournament.description,
    image: tournament.image, // Include image
    category: tournament.category, // Include category for routing
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

  // Touch handlers for swipe on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swipe left - next slide
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swipe right - previous slide
      prevSlide();
    }
    
    setTouchStart(0);
    setTouchEnd(0);
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
          <h2 
            className="font-bold text-xl sm:text-2xl"
            style={{ 
              fontSize: 'clamp(1.25rem, 4vw, 2rem)',
              color: 'var(--color-dark)',
              fontFamily: 'var(--font-heading)'
            }}
          >
            Upcoming Events and Tournaments
          </h2>
          <Link
            href="/all"
            className="text-sm font-semibold hover:opacity-80 transition whitespace-nowrap"
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
          {/* Navigation Buttons - Hidden on mobile, shown on tablet+ */}
          <button
            onClick={prevSlide}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2.5 shadow-lg transition -translate-x-2 items-center justify-center"
            style={{
              backgroundColor: 'var(--color-light)',
              minWidth: '44px',
              minHeight: '44px'
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full p-2.5 shadow-lg transition translate-x-2 items-center justify-center"
            style={{
              backgroundColor: 'var(--color-light)',
              minWidth: '44px',
              minHeight: '44px'
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
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Events Carousel */}
          <div 
            className="overflow-hidden rounded-xl"
            style={{
              backgroundColor: 'rgba(255, 122, 0, 0.05)', // Subtle orange tint matching accent color
              padding: '16px',
            }}
          >
            <div
              ref={carouselRef}
              className="flex transition-transform duration-500 ease-in-out gap-4"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {events.map((event, index) => (
                <div 
                  key={index} 
                  className="flex-shrink-0 px-3"
                  style={{
                    width: `${100 / itemsPerView}%`,
                    minWidth: `${100 / itemsPerView}%`,
                  }}
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

