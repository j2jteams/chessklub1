'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventData, TimeControl } from '@/lib/types';
import Badge from './Badge';
import TournamentInfoRow from './TournamentInfoRow';
import { formatDisplayDate, getUrgencyLabel, isOnline, formatPrice, getTournamentPrice } from '@/lib/tournamentHelpers';

interface TournamentCardProps {
  tournament: EventData;
  isSuperAdmin?: boolean;
  onDelete?: (id: string) => void;
  registrationCount?: number;
}

export default function TournamentCard({ 
  tournament, 
  isSuperAdmin = false, 
  onDelete,
  registrationCount 
}: TournamentCardProps) {
  const router = useRouter();
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);

  // Close admin menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setShowAdminMenu(false);
      }
    };

    if (showAdminMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAdminMenu]);

  const getDateDisplay = () => {
    if (tournament.category === 'tournament' && tournament.startDate) {
      const startDate = tournament.startDate instanceof Date ? tournament.startDate : new Date(tournament.startDate);
      if (tournament.endDate) {
        const endDate = tournament.endDate instanceof Date ? tournament.endDate : new Date(tournament.endDate);
        const startStr = formatDisplayDate(startDate);
        const endStr = formatDisplayDate(endDate);
        return startStr === endStr ? startStr : `${startStr} - ${endStr}`;
      }
      return formatDisplayDate(startDate);
    }
    return formatDisplayDate(tournament.date);
  };

  const getLocationDisplay = () => {
    if (tournament.category === 'tournament' && tournament.venue) {
      return tournament.venue;
    }
    return tournament.location || '';
  };

  // Check if tournament is new (created within last 7 days)
  const isNew = tournament.createdAt && (() => {
    const createdDate = tournament.createdAt instanceof Date ? tournament.createdAt : new Date(tournament.createdAt);
    const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 7;
  })();

  const priceValue = getTournamentPrice(tournament);
  const isFree = priceValue === null || priceValue === 0;
  const priceDisplay = formatPrice(priceValue);

  // Determine mode of play
  const tournamentIsOnline = isOnline(tournament);
  const venueType = tournamentIsOnline ? 'Online' : 'In-person';
  
  // Get urgency label
  const urgencyLabel = getUrgencyLabel(tournament);
  
  // Check if event is finished
  const isFinished = urgencyLabel?.text === 'Event finished';

  // Get tournament title (handle short/demo names)
  const getTitle = () => {
    const title = tournament.title || tournament.name || '';
    // Handle very short titles or single characters
    if (title.length <= 2 || title.toLowerCase() === 'demo' || title.toLowerCase() === 'test' || /^\d+$/.test(title)) {
      return 'Untitled Tournament';
    }
    // Clean up demo/test names
    if (title.toLowerCase().includes('demo') || title.toLowerCase().includes('test')) {
      const cleaned = title.replace(/demo|test/gi, '').trim();
      return cleaned.length > 2 ? cleaned : 'Chess Tournament';
    }
    return title;
  };

  // Get description preview
  const getDescriptionPreview = () => {
    if (!tournament.description) return '';
    return tournament.description.trim();
  };

  const dateDisplay = getDateDisplay();
  const locationDisplay = getLocationDisplay();
  // Compute time control label with priority: customLabel > format > category
  const tc = tournament.timeControl;
  const formatDisplay = (() => {
    if (tc) {
      if (typeof tc === 'object' && 'category' in tc) {
        // New format: TimeControl object
        const timeControl = tc as TimeControl;
        return timeControl.customLabel?.trim() || 
               timeControl.format?.trim() || 
               timeControl.category || 
               '';
      } else if (typeof tc === 'string') {
        // Legacy format: string
        return tc;
      }
    }
    return '';
  })();
  const title = getTitle();
  const descriptionPreview = getDescriptionPreview();

  // Handle card click (excluding admin tools and register button)
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons, links, or admin tools
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[data-admin-tools]') ||
      target.closest('[data-register-button]')
    ) {
      return;
    }
    if (tournament.id) {
      router.push(`/events/${tournament.id}`);
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-md border transition-all duration-200 overflow-hidden flex flex-col h-full cursor-pointer ${
        tournamentIsOnline 
          ? 'border-violet-200 border-t-4 border-t-violet-300' 
          : 'border-gray-100'
      } hover:shadow-xl hover:-translate-y-1`}
      onClick={handleCardClick}
    >
      {/* Banner Section with Badges */}
      <div className="relative h-32 overflow-hidden rounded-t-xl">
        {tournament.image || tournament.heroImageUrl ? (
          <>
            <img 
              src={tournament.heroImageUrl || tournament.image} 
              alt={title}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay - softer, more premium */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/5"></div>
          </>
        ) : (
          <>
            {/* Subtle chessboard pattern background */}
            <div 
              className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 20px),
                  repeating-linear-gradient(90deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 20px)
                `,
              }}
            ></div>
            {/* Gradient overlay - softer, more premium */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/5"></div>
          </>
        )}
        
        {/* Badges in top-right of banner */}
        <div className="absolute top-3 right-3 flex flex-wrap gap-1.5 justify-end z-10">
          {isNew && <Badge label="New" variant="new" />}
          {isFree && <Badge label="Free" variant="free" />}
          {venueType === 'Online' && <Badge label="Online" variant="online" />}
          {venueType === 'In-person' && <Badge label="In-person" variant="inperson" />}
          <Badge 
            label={tournament.type === 'tournament' || tournament.category === 'tournament' ? 'Tournament' : 'Event'} 
            variant="category" 
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-5 py-4 flex-grow flex flex-col space-y-3">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 min-h-[48px]">
          {title}
        </h3>

        {/* Metadata Row */}
        <div>
          <TournamentInfoRow
            date={dateDisplay}
            location={locationDisplay}
            format={formatDisplay}
            price={priceDisplay}
            isOnline={tournamentIsOnline}
          />
        </div>

        {/* Description Preview */}
        {descriptionPreview && (
          <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px]">
            {descriptionPreview}
          </p>
        )}

        {/* Urgency/Status Text */}
        {urgencyLabel && (
          <p className={`text-xs font-medium ${urgencyLabel.color}`}>
            {urgencyLabel.text}
          </p>
        )}

        {/* Registration Count */}
        {registrationCount !== undefined && registrationCount > 0 && (
          <p className="text-xs text-gray-500">
            👤 {registrationCount} {registrationCount === 1 ? 'player' : 'players'} registered
          </p>
        )}

        {/* Button Row */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex justify-between gap-3">
            <Link
              href={`/events/${tournament.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Learn More
            </Link>
            <Link
              href={`/events/${tournament.id}`}
              onClick={(e) => e.stopPropagation()}
              data-register-button
              className={`flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${
                isFinished 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#FF7A00] hover:bg-[#E46800]'
              }`}
            >
              Register
            </Link>
          </div>

          {/* Admin Tools Dropdown */}
          {isSuperAdmin && tournament.id && !tournament.id.startsWith('featured-') && (
            <div className="mt-2 relative" ref={adminMenuRef} data-admin-tools>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAdminMenu(!showAdminMenu);
                }}
                className="w-full text-xs text-gray-500 hover:text-gray-700 py-1 flex items-center justify-center gap-1"
              >
                Admin Tools
                <svg 
                  className={`w-3 h-3 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showAdminMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                  <Link
                    href={`/admin/events/edit/${tournament.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAdminMenu(false);
                    }}
                    className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete "${title}"?`)) {
                        onDelete?.(tournament.id!);
                        setShowAdminMenu(false);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
