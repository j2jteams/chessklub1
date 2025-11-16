'use client';

import { useState } from 'react';
import EventCard from './EventCard';

interface Event {
  title: string;
  date: string;
  location: string;
  price: string;
  description?: string;
}

const events: Event[] = [
  { 
    title: "Chess Workshop", 
    date: "Feb 20", 
    location: "NYC", 
    price: "$25",
    description: "Learn advanced strategies from master players"
  },
  { 
    title: "Simul Exhibition", 
    date: "Feb 28", 
    location: "LA", 
    price: "Free",
    description: "Watch grandmasters play multiple games simultaneously"
  },
  { 
    title: "Chess Camp", 
    date: "Mar 1-3", 
    location: "Chicago", 
    price: "$200",
    description: "Intensive 3-day training camp for all skill levels"
  },
  { 
    title: "Blitz Night", 
    date: "Mar 8", 
    location: "Boston", 
    price: "$15",
    description: "Fast-paced blitz tournament with prizes"
  },
  { 
    title: "Youth Championship", 
    date: "Mar 15", 
    location: "Seattle", 
    price: "$50",
    description: "Competition for players under 18"
  },
  { 
    title: "Master Class", 
    date: "Mar 22", 
    location: "Miami", 
    price: "$75",
    description: "Learn from international masters"
  },
];

export default function EventsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerView = 4; // Desktop default

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
    <section id="events" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-slate-900 mb-8 text-center">
          Upcoming Events
        </h2>
        
        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-orange-500 hover:text-white transition"
            aria-label="Previous events"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:bg-orange-500 hover:text-white transition"
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
                className={`w-2 h-2 rounded-full transition ${
                  Math.floor(currentIndex / itemsPerView) === index
                    ? 'bg-orange-500 w-8'
                    : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

