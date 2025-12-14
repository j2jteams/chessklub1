'use client';

import { CalendarDays, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { EventData, TimeControl } from '@/lib/types';
import { formatDisplayDate, isOnline, formatPrice, getTournamentPrice } from '@/lib/tournamentHelpers';

type TournamentCardProps = {
  tournament: EventData;
  isFeatured?: boolean;
};

export default function TournamentCard({
  tournament,
  isFeatured = false,
}: TournamentCardProps) {
  const priceValue = getTournamentPrice(tournament);
  const priceDisplay = formatPrice(priceValue);
  const dateToFormat = tournament.startDate || tournament.date;
  const dateDisplay = formatDisplayDate(dateToFormat);
  const locationDisplay = tournament.venue || tournament.location || 'Location TBD';
  
  // Determine badge from ratingType
  let badge: string | undefined;
  if (tournament.type === 'tournament' || tournament.category === 'tournament') {
    if (tournament.ratingType) {
      badge = `${tournament.ratingType} Rated`;
    } else if (tournament.fideRated) {
      // Legacy support
      badge = 'FIDE Rated';
    }
  }
  
  // Compute time control label with priority: customLabel > format > category
  const tc = tournament.timeControl;
  const timeControlLabel = (() => {
    if (tc) {
      if (typeof tc === 'object' && 'category' in tc) {
        // New format: TimeControl object
        const timeControl = tc as TimeControl;
        return timeControl.customLabel?.trim() || 
               timeControl.format?.trim() || 
               timeControl.category || 
               null;
      } else if (typeof tc === 'string') {
        // Legacy format: string
        return tc;
      }
    }
    return null;
  })();

  // Build tags array
  const tags: string[] = [];
  if (isOnline(tournament)) {
    tags.push('Online');
  } else {
    tags.push('In-person');
  }
  // Add time control label to tags if available
  if (timeControlLabel) {
    tags.push(timeControlLabel);
  }
  if (tournament.tags && tournament.tags.length > 0) {
    tags.push(...tournament.tags);
  }

  const name = tournament.title || tournament.name || 'Untitled Tournament';

  const cardContent = (
    <article
      className={[
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all",
        "hover:-translate-y-1 hover:shadow-xl hover:border-orange-300/70",
      ].join(" ")}
    >
      {/* Flyer Image Section - Larger and Prominent */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
        {tournament.image || tournament.heroImageUrl ? (
          <>
            <img 
              src={tournament.heroImageUrl || tournament.image} 
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
            {/* Subtle gradient overlay for better badge/text visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
          </>
        ) : (
          <>
            {/* Fallback pattern when no image */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundSize: "24px 24px",
                backgroundImage: `
                  linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px),
                  linear-gradient(180deg, rgba(148,163,184,0.4) 1px, transparent 1px)
                `,
              }}
            />
          </>
        )}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white drop-shadow-lg">
            <Trophy className="h-4 w-4 text-orange-400" />
            {isFeatured ? <span>Featured Tournament</span> : <span>Upcoming Event</span>}
          </div>
          {badge && (
            <span className="rounded-full bg-orange-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-lg">
              {badge}
            </span>
          )}
        </div>
      </div>
      {/* Reduced White Content Area */}
      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-3 pt-3">
        <h3 className="line-clamp-2 text-base font-semibold text-slate-900 leading-tight">
          {name}
        </h3>
        <div className="space-y-1 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <CalendarDays className="mt-[2px] h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
            <p className="leading-snug">{dateDisplay}</p>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-[2px] h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
            <p className="leading-snug line-clamp-1">{locationDisplay}</p>
          </div>
          {timeControlLabel && (
            <div className="flex items-start gap-2">
              <span className="mt-[2px] text-[13px] flex-shrink-0">⏱</span>
              <p className="leading-snug">{timeControlLabel}</p>
            </div>
          )}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <span className="text-[14px]">💰</span>
            {priceDisplay.toLowerCase() === "free" ? (
              <span className="text-green-600 text-sm">Free</span>
            ) : (
              <span className="text-orange-600 text-sm">{priceDisplay}</span>
            )}
          </div>
          <span className="inline-flex items-center justify-center rounded-full border border-orange-500 px-3 py-1 text-xs font-semibold text-orange-600 transition group-hover:bg-orange-500 group-hover:text-white pointer-events-none">
            View Details
          </span>
        </div>
      </div>
    </article>
  );

  if (tournament.id) {
    return (
      <Link href={`/events/${tournament.id}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
