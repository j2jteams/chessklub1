'use client';

import { useState } from 'react';
import { EventData, TimeControl } from '@/lib/types';

interface RulesAccordionProps {
  event?: EventData | {
    timeControl?: string | TimeControl;
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
      content: 'Standard FIDE rules apply. Players must arrive on time. Late arrivals may forfeit games. No electronic devices allowed during play.',
      isEmpty: false
    },
    {
      id: 'time-control',
      title: 'Time Control',
      content: (() => {
        const tc = event?.timeControl;
        if (tc) {
          let timeControlLabel: string | null = null;
          if (typeof tc === 'object' && 'category' in tc) {
            // New format: TimeControl object
            const timeControl = tc as any;
            timeControlLabel = timeControl.customLabel?.trim() || 
                              timeControl.format?.trim() || 
                              timeControl.category || 
                              null;
          } else if (typeof tc === 'string') {
            // Legacy format: string
            timeControlLabel = tc;
          }
          return timeControlLabel 
            ? `Time control: ${timeControlLabel}. Each player will have the specified time for the entire game.`
            : 'The organizer has not added specific rules for this section yet. Standard Chess Federation rules apply.';
        }
        return 'The organizer has not added specific rules for this section yet. Standard Chess Federation rules apply.';
      })(),
      isEmpty: !event?.timeControl
    },
    {
      id: 'bye-policy',
      title: 'Bye Policy',
      content: 'Players may request a bye for one round. Byes must be requested at least 24 hours before the round. Half-point byes are available for rounds 1-3.',
      isEmpty: false
    },
    {
      id: 'code-of-conduct',
      title: 'Code of Conduct',
      content: 'All players must maintain respectful behavior. Cheating, harassment, or unsportsmanlike conduct will result in immediate disqualification.',
      isEmpty: false
    },
    {
      id: 'refund-policy',
      title: 'Refund Policy',
      content: 'Full refunds available up to 7 days before the tournament. 50% refund available up to 3 days before. No refunds within 3 days of the tournament.',
      isEmpty: false
    }
  ];

  const faqItems = [
    {
      id: 'arrival-time',
      question: 'What time should I arrive?',
      answer: 'Please arrive at least 30 minutes before the first round to allow time for registration and pairing announcements. Late arrivals may result in forfeit of the first round.'
    },
    {
      id: 'chess-set',
      question: 'Do I need to bring a chess set?',
      answer: 'Chess sets and clocks are typically provided by the organizer. However, it\'s always good to check with the organizer beforehand or bring your own as a backup.'
    },
    {
      id: 'refund-policy-faq',
      question: 'Is there a refund policy?',
      answer: 'Refund policies vary by tournament. Generally, full refunds are available up to 7 days before the event, with partial refunds available closer to the date. Check the Refund Policy section above for specific details.'
    },
    {
      id: 'rating-requirement',
      question: 'Do I need a specific rating to participate?',
      answer: 'Rating requirements vary by tournament and section. Some tournaments are open to all players, while others may have rating restrictions. Check the tournament overview for rating range information.'
    },
    {
      id: 'pairings',
      question: 'How are pairings determined?',
      answer: 'Pairings are typically done using Swiss system pairing software, which matches players with similar scores. Pairings are usually announced before each round and posted at the tournament venue or online.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Rules & Regulations */}
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
                  <p className={`text-base ${rule.isEmpty ? 'text-gray-500 italic' : 'text-gray-600'}`}>
                    {rule.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-2">
          {faqItems.map((faq) => (
            <div key={faq.id} className="border border-[#E2E2E2] rounded-lg">
              <button
                onClick={() => toggleItem(faq.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F6F6F6] transition"
              >
                <span className="text-base font-medium text-gray-900">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${
                    openItems.has(faq.id) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openItems.has(faq.id) && (
                <div className="px-4 pb-4">
                  <p className="text-base text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

