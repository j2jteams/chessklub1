'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'rated', label: 'Rated' },
  { id: 'online', label: 'Online' },
  { id: 'scholastic', label: 'Scholastic / Kids' },
  { id: 'open', label: 'Open / Adult' },
  { id: 'weekend', label: 'This Weekend' },
  { id: 'nearme', label: 'Near Me' },
];

export default function TournamentCategoryChips() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    
    // Navigate to tournaments page with filter
    if (categoryId === 'nearme') {
      // For "Near Me", redirect to tournaments page which will handle geolocation
      router.push('/tournaments?filter=nearme');
    } else if (categoryId !== 'all') {
      // For other filters, redirect with appropriate query params
      router.push(`/tournaments?filter=${categoryId}`);
    } else {
      // For "All", just go to tournaments page
      router.push('/tournaments');
    }
  };

  return (
    <section className="bg-white border-b border-gray-200 sticky top-[64px] sm:top-[80px] z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-3 min-w-max">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`inline-flex items-center px-5 py-2.5 rounded-full border-2 text-sm font-semibold transition whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-400 hover:text-orange-600 cursor-pointer'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

