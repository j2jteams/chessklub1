'use client';

import { EventData } from '@/lib/types';

interface ContactOrganizerCardProps {
  event: EventData;
}

export default function ContactOrganizerCard({ event }: ContactOrganizerCardProps) {
  const organizerName = event.createdByEmail?.split('@')[0] || 'Organizer';
  const email = event.contactEmail || event.createdByEmail;
  const phone = event.contactPhone;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Organizer</h3>
      
      <div className="space-y-4">
        {/* Organizer Name */}
        <div>
          <p className="text-sm text-[#6A6A6A] mb-1">Organizer</p>
          <p className="text-base font-medium text-gray-900">{organizerName}</p>
        </div>

        {/* Email */}
        {email && (
          <div>
            <p className="text-sm text-[#6A6A6A] mb-1">Email</p>
            <a
              href={`mailto:${email}`}
              className="text-base font-medium text-[#FF7A00] hover:text-[#E46800] transition"
            >
              {email}
            </a>
          </div>
        )}

        {/* Phone */}
        {phone && (
          <div>
            <p className="text-sm text-[#6A6A6A] mb-1">Phone</p>
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="text-base font-medium text-[#FF7A00] hover:text-[#E46800] transition"
            >
              {phone}
            </a>
          </div>
        )}

        {/* Send Message Button */}
        {email && (
          <button
            onClick={() => window.location.href = `mailto:${email}`}
            className="w-full mt-4 px-4 py-2 bg-[#FF7A00] hover:bg-[#E46800] text-white rounded-lg transition text-sm font-medium"
          >
            Send Message
          </button>
        )}
      </div>
    </div>
  );
}

