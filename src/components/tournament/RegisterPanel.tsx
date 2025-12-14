'use client';

import { useState } from 'react';
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
  registrationsCount?: number; // Number of registered players
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
  eventId,
  registrationsCount = 0
}: RegisterPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
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
  const registeredCount = registrationsCount || event.registeredUsers?.length || 0;
  const maxPlayers = event.maxPlayers;
  const spotsRemaining = maxPlayers ? maxPlayers - registeredCount : null;
  const fillPercentage = maxPlayers ? Math.min((registeredCount / maxPlayers) * 100, 100) : 0;

  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const getShareUrl = () => {
    return window.location.href;
  };

  const getShareText = () => {
    return `Check out this chess tournament: ${event.title || event.name}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Price Badge */}
      <div className="text-center mb-6">
        {price === 'Free' || price === '$0.00' ? (
          <span className="inline-block px-6 py-3 bg-[#FF7A00] text-white rounded-full text-xl font-bold">
            Free entry
          </span>
        ) : (
          <>
            <span className="inline-block px-4 py-2 bg-[#FF7A00] text-white rounded-full text-lg font-bold">
              {price}
            </span>
            <p className="text-sm text-[#6A6A6A] mt-2">
              {event.category === 'tournament' && event.sections && event.sections.length > 0
                ? 'per section'
                : `per ${event.category === 'tournament' ? 'tournament' : 'event'}`}
            </p>
          </>
        )}
      </div>

      {/* Registered Count with Progress Bar */}
      <div className="mb-6 p-4 bg-[#F6F6F6] rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <svg className="w-5 h-5 text-[#FF7A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-base font-medium text-gray-900">
            {registeredCount} {registeredCount === 1 ? 'player' : 'players'} registered
          </p>
        </div>
        {maxPlayers && (
          <>
            <p className="text-sm text-[#6A6A6A] text-center mb-2">
              {registeredCount} / {maxPlayers} spots filled
            </p>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-[#FF7A00] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${fillPercentage}%` }}
              ></div>
            </div>
            {spotsRemaining !== null && spotsRemaining > 0 && (
              <p className="text-xs text-[#6A6A6A] text-center mt-2">{spotsRemaining} spots remaining</p>
            )}
          </>
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

      {/* Share Section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Share</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {copied ? 'Link Copied!' : 'Copy Link'}
          </button>
          <div className="flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${getShareText()} ${getShareUrl()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(getShareText())}&body=${encodeURIComponent(getShareUrl())}`}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </a>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          Link copied to clipboard!
        </div>
      )}

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

