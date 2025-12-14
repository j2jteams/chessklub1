'use client';

import Link from 'next/link';

export default function FinalCTA() {
  return (
    <section className="bg-slate-950 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Compete?
        </h2>
        <p className="text-lg text-gray-300 mb-8">
          Join players competing in tournaments across cities and online.
        </p>
        <Link
          href="/tournaments"
          className="inline-block px-10 py-4 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition shadow-lg"
        >
          Browse Tournaments
        </Link>
      </div>
    </section>
  );
}



