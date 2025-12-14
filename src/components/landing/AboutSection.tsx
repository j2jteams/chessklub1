'use client';

export default function AboutSection() {
  return (
    <section className="bg-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Built for Chess Players and Organizers
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            This platform centralizes tournaments from around the world, making registration easier for players and event management simpler for organizers. Soon, we'll support live pairings, standings, and comprehensive tournament results.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-orange-500">✓</span>
              <span>Centralized list of tournaments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-500">✓</span>
              <span>Easy registration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-500">✓</span>
              <span>Results & standings coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



