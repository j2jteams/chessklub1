'use client';

import { useState } from 'react';

interface RulesAccordionProps {
  event?: {
    timeControl?: string;
    description?: string;
  };
}

export default function RulesAccordion({ event }: RulesAccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (item: string) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(item)) {
      newOpen.delete(item);
    } else {
      newOpen.add(item);
    }
    setOpenItems(newOpen);
  };

  const rules = [
    {
      id: 'tournament-rules',
      title: 'Tournament Rules',
      content: 'Standard FIDE rules apply. Players must arrive on time. Late arrivals may forfeit games. No electronic devices allowed during play.'
    },
    {
      id: 'time-control',
      title: 'Time Control',
      content: event?.timeControl 
        ? `Time control: ${event.timeControl}. Each player will have the specified time for the entire game.`
        : 'Time control will be announced before the tournament begins.'
    },
    {
      id: 'bye-policy',
      title: 'Bye Policy',
      content: 'Players may request a bye for one round. Byes must be requested at least 24 hours before the round. Half-point byes are available for rounds 1-3.'
    },
    {
      id: 'code-of-conduct',
      title: 'Code of Conduct',
      content: 'All players must maintain respectful behavior. Cheating, harassment, or unsportsmanlike conduct will result in immediate disqualification.'
    },
    {
      id: 'refund-policy',
      title: 'Refund Policy',
      content: 'Full refunds available up to 7 days before the tournament. 50% refund available up to 3 days before. No refunds within 3 days of the tournament.'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Rules & Regulations</h2>
      
      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className="border border-[#E2E2E2] rounded-lg">
            <button
              onClick={() => toggleItem(rule.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F6F6F6] transition"
            >
              <span className="text-base font-medium text-gray-900">{rule.title}</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openItems.has(rule.id) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {openItems.has(rule.id) && (
              <div className="px-4 pb-4">
                <p className="text-base text-gray-600">{rule.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

