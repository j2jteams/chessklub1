'use client';

interface AboutTournamentCardProps {
  description: string;
  eventName: string;
}

export default function AboutTournamentCard({ description, eventName }: AboutTournamentCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-[#FF7A00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-semibold">About This Tournament</h2>
      </div>

      {/* Divider */}
      <div className="border-b border-[#E2E2E2] mb-6"></div>

      {/* Body Text with Left Border Accent */}
      <div className="border-l-4 border-[#FF7A00] pl-4">
        <div className="prose prose-base max-w-none text-gray-700 whitespace-pre-line">
          {description.split('\n').map((line, index) => {
            // Check if line starts with bullet point indicators
            if (line.trim().match(/^[-•*]\s/)) {
              return (
                <div key={index} className="flex items-start mb-2">
                  <span className="text-[#FF7A00] mr-2">•</span>
                  <span>{line.replace(/^[-•*]\s/, '')}</span>
                </div>
              );
            }
            return <p key={index} className="mb-4 last:mb-0">{line}</p>;
          })}
        </div>
      </div>
    </div>
  );
}

