'use client';

import { useState, useRef, useEffect } from 'react';

export type ReminderOption = '1_day' | '2_hours' | '30_minutes';

interface SetReminderButtonProps {
  onReminderSelected?: (option: ReminderOption) => void;
}

export default function SetReminderButton({ onReminderSelected }: SetReminderButtonProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  function handleSelect(opt: ReminderOption) {
    if (onReminderSelected) {
      onReminderSelected(opt);
    }
    
    // Temporary UX feedback - can be replaced with toast notification later
    alert("Reminder preference saved. We'll remind you before the event.");
    setOpen(false);
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        Set Reminder
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-20 mt-2 rounded-lg border border-gray-200 bg-white py-2 text-sm shadow-lg">
          <button
            className="block w-full px-3 py-2 text-left hover:bg-gray-50 transition"
            onClick={() => handleSelect('1_day')}
          >
            1 day before
          </button>
          <button
            className="block w-full px-3 py-2 text-left hover:bg-gray-50 transition"
            onClick={() => handleSelect('2_hours')}
          >
            2 hours before
          </button>
          <button
            className="block w-full px-3 py-2 text-left hover:bg-gray-50 transition"
            onClick={() => handleSelect('30_minutes')}
          >
            30 minutes before
          </button>
        </div>
      )}
    </div>
  );
}




