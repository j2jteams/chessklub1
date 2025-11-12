import { EventCard as EventCardType } from '../types/events';

interface EventCardProps {
  event: EventCardType;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-32 bg-gradient-to-br ${event.gradientFrom} ${event.gradientTo}`}></div>
      <div className="p-4">
        <span className="text-xs font-semibold text-blue-600 uppercase">{event.category}</span>
        <h3 className="text-lg font-bold text-gray-900 mt-2 mb-1">{event.title}</h3>
        <p className="text-sm text-gray-600 mb-3">{event.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">{event.price}</span>
          <button 
            className="text-blue-600 font-medium hover:text-blue-700 cursor-not-allowed opacity-75"
            disabled
          >
            Learn More →
          </button>
        </div>
      </div>
    </div>
  );
}

