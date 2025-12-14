'use client';

import { useState, useEffect, useRef } from 'react';
import { EventData } from '@/lib/types';
import TournamentCard from '@/components/TournamentCard';

interface FeaturedTournamentsCarouselProps {
  tournaments: EventData[];
  loading?: boolean;
}

export default function FeaturedTournamentsCarousel({ tournaments, loading }: FeaturedTournamentsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Calculate items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerView(3);
      } else if (window.innerWidth >= 640) {
        setItemsPerView(2);
      } else {
        setItemsPerView(1);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Get featured tournaments (first 6 for carousel)
  const featuredTournaments = tournaments.length > 0 ? tournaments.slice(0, Math.min(6, tournaments.length)) : [];
  const maxIndex = Math.max(0, featuredTournaments.length - itemsPerView);
  
  // Debug logging
  useEffect(() => {
    console.log('FeaturedTournamentsCarousel - tournaments:', tournaments.length, 'featured:', featuredTournaments.length);
  }, [tournaments.length, featuredTournaments.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  return (
    <section className="bg-gray-50 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            Featured Tournaments
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Hand-picked events you might like.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tournaments...</p>
          </div>
        ) : featuredTournaments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No featured tournaments available.
          </div>
        ) : (
          <div className="relative">
            {/* Navigation Buttons */}
            <button
              onClick={prevSlide}
              className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full bg-white/90 backdrop-blur-sm p-3 shadow-lg hover:bg-white transition items-center justify-center"
              aria-label="Previous tournaments"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextSlide}
              className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full bg-white/90 backdrop-blur-sm p-3 shadow-lg hover:bg-white transition items-center justify-center"
              aria-label="Next tournaments"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Carousel */}
            <div className="overflow-hidden rounded-xl">
              <div
                ref={carouselRef}
                className="flex transition-transform duration-500 ease-in-out gap-6"
                style={{
                  transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                }}
              >
                {featuredTournaments.map((tournament, index) => (
                  <div
                    key={tournament.id || index}
                    className="flex-shrink-0"
                    style={{
                      width: `${100 / itemsPerView}%`,
                      minWidth: `${100 / itemsPerView}%`,
                    }}
                  >
                    <TournamentCard tournament={tournament} isFeatured={true} />
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: Math.ceil(featuredTournaments.length / itemsPerView) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index * itemsPerView)}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    width: Math.floor(currentIndex / itemsPerView) === index ? '2rem' : '0.5rem',
                    backgroundColor: Math.floor(currentIndex / itemsPerView) === index
                      ? '#f97316'
                      : '#d1d5db',
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

