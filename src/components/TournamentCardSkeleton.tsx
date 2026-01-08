'use client';

interface TournamentCardSkeletonProps {
  variant?: 'compact' | 'default';
}

export default function TournamentCardSkeleton({ variant = 'default' }: TournamentCardSkeletonProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm animate-pulse">
      {/* Image Skeleton */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200">
        {/* Badge placeholders */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
          <div className="h-4 w-24 bg-slate-300 rounded"></div>
          <div className="h-5 w-20 bg-slate-300 rounded-full"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-1 flex-col gap-2.5 px-4 pb-3 pt-3">
        {/* Title - 2 lines */}
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 rounded w-3/4"></div>
          <div className="h-5 bg-slate-200 rounded w-1/2"></div>
        </div>

        {/* Meta info - 3 lines */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 bg-slate-200 rounded"></div>
            <div className="h-3 bg-slate-200 rounded w-24"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 bg-slate-200 rounded"></div>
            <div className="h-3 bg-slate-200 rounded w-32"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-3.5 bg-slate-200 rounded"></div>
            <div className="h-3 bg-slate-200 rounded w-20"></div>
          </div>
        </div>

        {/* Tags skeleton */}
        <div className="flex flex-wrap gap-1">
          <div className="h-5 bg-slate-200 rounded-full w-16"></div>
          <div className="h-5 bg-slate-200 rounded-full w-20"></div>
          <div className="h-5 bg-slate-200 rounded-full w-14"></div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-200"></div>

        {/* Footer - Price and CTA */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded w-16"></div>
          <div className="h-6 bg-slate-200 rounded-full w-24"></div>
        </div>
      </div>
    </article>
  );
}


