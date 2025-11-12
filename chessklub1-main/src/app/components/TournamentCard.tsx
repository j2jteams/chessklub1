import { TournamentCard as TournamentCardType } from '../types/events';

interface TournamentCardProps {
  tournament: TournamentCardType;
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`h-48 bg-gradient-to-br ${tournament.gradientFrom} ${tournament.gradientTo} flex items-center justify-center`}>
        <span className="text-6xl">{tournament.icon}</span>
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-blue-600 uppercase">{tournament.category}</span>
          <span className="text-sm text-gray-500">{tournament.date}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{tournament.title}</h3>
        <p className="text-gray-600 mb-4">{tournament.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">{tournament.price}</span>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors cursor-not-allowed opacity-75"
            disabled
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
}

