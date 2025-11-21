import Link from 'next/link';
import { EventData } from '@/lib/types';

interface TournamentCardProps {
  tournament: EventData;
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  return (
    <div 
      className="rounded-lg overflow-hidden transition hover:shadow-xl"
      style={{
        backgroundColor: 'var(--color-light)',
        padding: 'var(--space-md)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      {tournament.image ? (
        <div className="h-48 mb-4 overflow-hidden rounded">
          <img 
            src={tournament.image} 
            alt={tournament.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mb-4 rounded">
          <span className="text-white text-xl font-bold text-center px-4">{tournament.title}</span>
        </div>
      )}
      <div>
        <h3 
          className="font-bold mb-1"
          style={{ 
            fontSize: '1.25rem',
            color: 'var(--color-dark)',
            fontFamily: 'var(--font-heading)'
          }}
        >
          {tournament.title}
        </h3>
        <p style={{ color: 'var(--color-gray)', marginBottom: '0.5rem' }}>📍 {tournament.location}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span 
            className="text-white text-xs font-semibold px-2 py-1 rounded"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            📅 {tournament.date}
          </span>
        </div>
        {tournament.description && (
          <p 
            style={{ 
              color: 'var(--color-gray)', 
              marginBottom: '1rem',
              fontSize: '0.9rem',
              lineHeight: '1.5'
            }}
          >
            {tournament.description.length > 100 
              ? `${tournament.description.substring(0, 100)}...` 
              : tournament.description}
          </p>
        )}
        <div className="flex justify-between items-center mb-4">
          <span 
            className="font-bold"
            style={{ 
              fontSize: '1.5rem',
              color: 'var(--color-accent)'
            }}
          >
            {tournament.price}
          </span>
        </div>
        <Link
          href={`/tournaments?event=${tournament.id}`}
          className="block w-full text-center text-white py-3 rounded font-semibold transition hover:opacity-90"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          Register Now
        </Link>
      </div>
    </div>
  );
}

