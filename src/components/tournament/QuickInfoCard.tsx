'use client';

import { EventData } from '@/lib/types';

interface QuickInfoCardProps {
  event: EventData;
  registrationsCount: number;
}

export default function QuickInfoCard({ event, registrationsCount }: QuickInfoCardProps) {
  const format = event.timeControl || 'Not specified';
  const venueType = event.coordinates ? 'In-person' : 'Online';

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Info</h3>
      
      <div className="space-y-3">
        {/* Category */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#6A6A6A]">Category:</span>
          <span className="px-2 py-1 text-xs font-medium bg-[#FF7A00] text-white rounded">
            {event.category}
          </span>
        </div>

        {/* Status */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#6A6A6A]">Status:</span>
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            event.status === 'approved' 
              ? 'bg-[#2ECC71] text-white' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {event.status}
          </span>
        </div>

        {/* Registrations */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#6A6A6A]">Registrations:</span>
          <span className="text-sm font-semibold text-gray-900">{registrationsCount}</span>
        </div>

        {/* Format */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#6A6A6A]">Format:</span>
          <span className="text-sm font-medium text-gray-900">{format}</span>
        </div>

        {/* Venue Type */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[#6A6A6A]">Venue Type:</span>
          <span className="text-sm font-medium text-gray-900">{venueType}</span>
        </div>
      </div>
    </div>
  );
}

