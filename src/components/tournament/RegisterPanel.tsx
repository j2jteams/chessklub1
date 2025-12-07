'use client';

import { EventData } from '@/lib/types';
import AddToCalendarButton from './AddToCalendarButton';
import SetReminderButton from './SetReminderButton';

interface RegisterPanelProps {
  event: EventData;
  isRegistered: boolean;
  isSaved?: boolean; // Optional - kept for backward compatibility but not used
  registering: boolean;
  saving?: boolean; // Optional - kept for backward compatibility but not used
  onRegister: () => void;
  onSave?: () => void; // Optional - kept for backward compatibility but not used
  user: any;
  router: any;
  eventId: string;
}

export default function RegisterPanel({
  event,
  isRegistered,
  isSaved,
  registering,
  saving,
  onRegister,
  onSave,
  user,
  router,
  eventId
}: RegisterPanelProps) {
  const formatPrice = (priceStr: string) => {
    if (!priceStr) return 'Free';
    if (!/^[\$£€¥₹]/.test(priceStr.trim())) {
      const numPrice = parseFloat(priceStr.trim());
      if (!isNaN(numPrice)) {
        return `$${numPrice.toFixed(2)}`;
      }
    }
    return priceStr;
  };

  const getDisplayPrice = () => {
    if (event.category === 'tournament' && event.sections && event.sections.length > 0) {
      const sectionsWithFee = event.sections.filter(s => s.entryFee !== null && s.entryFee !== undefined);
      if (sectionsWithFee.length > 0) {
        const fees = sectionsWithFee.map(s => s.entryFee!);
        const minFee = Math.min(...fees);
        const maxFee = Math.max(...fees);
        if (minFee === maxFee) {
          return `$${minFee.toFixed(2)}`;
        } else {
          return `$${minFee.toFixed(2)} - $${maxFee.toFixed(2)}`;
        }
      }
    }
    return formatPrice(event.price || '');
  };

  const price = getDisplayPrice();
  const registeredCount = event.registeredUsers?.length || 0;
  const spotsRemaining = event.maxPlayers ? event.maxPlayers - registeredCount : null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Price Badge */}
      <div className="text-center mb-6">
        <span className="inline-block px-4 py-2 bg-[#FF7A00] text-white rounded-full text-lg font-bold">
          {price}
        </span>
        <p className="text-sm text-[#6A6A6A] mt-2">
          {event.category === 'tournament' && event.sections && event.sections.length > 0
            ? 'per section'
            : `per ${event.category === 'tournament' ? 'tournament' : 'event'}`}
        </p>
      </div>

      {/* Registered Count */}
      <div className="mb-6 p-4 bg-[#F6F6F6] rounded-lg text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <svg className="w-5 h-5 text-[#FF7A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-base font-medium text-gray-900">
            {registeredCount} {registeredCount === 1 ? 'player' : 'players'} registered
          </p>
        </div>
        {spotsRemaining !== null && spotsRemaining > 0 && (
          <p className="text-sm text-[#6A6A6A]">{spotsRemaining} spots remaining</p>
        )}
      </div>

      {/* Register Button */}
      <button
        onClick={onRegister}
        disabled={registering || event.status !== 'approved'}
        className={`w-full mb-3 px-6 py-4 rounded-lg font-bold text-lg transition ${
          isRegistered
            ? 'bg-gray-500 hover:bg-gray-600 text-white'
            : 'bg-gradient-to-r from-[#FF7A00] to-[#E46800] hover:from-[#E46800] hover:to-[#FF7A00] text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
      >
        {registering ? 'Processing...' : isRegistered ? '✓ Registered' : 'Register Now'}
      </button>

      {/* Add to Calendar Button */}
      <AddToCalendarButton tournament={event} />

      {/* Set Reminder Button */}
      <SetReminderButton
        onReminderSelected={(option) => {
          // Log to console for now - can be wired to Firestore/backend later
          console.log('Reminder selected:', option);
        }}
      />

      {/* Trust Indicators */}
      <div className="mt-6 space-y-2">
        <div className="flex items-center gap-2 text-sm text-[#6A6A6A]">
          <svg className="w-4 h-4 text-[#2ECC71]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Instant confirmation</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#6A6A6A]">
          <svg className="w-4 h-4 text-[#2ECC71]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span>Secure registration</span>
        </div>
      </div>

      {/* Sign In Prompt */}
      {!user && (
        <p className="text-xs text-[#6A6A6A] text-center mt-4">
          <button
            onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/events/${eventId}`)}`)}
            className="text-[#FF7A00] hover:text-[#E46800] underline"
          >
            Sign in
          </button> to register
        </p>
      )}
    </div>
  );
}

