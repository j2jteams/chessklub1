interface EventCardProps {
  title: string;
  date: string;
  location: string;
  price: string;
  image?: string;
  description?: string;
}

export default function EventCard({ 
  title, 
  date, 
  location, 
  price, 
  image,
  description 
}: EventCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition min-w-[280px] flex-shrink-0">
      <div className="text-sm font-semibold text-orange-500 mb-2">{date}</div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">📍 {location}</p>
      {description && (
        <p className="text-gray-600 text-sm mb-4">{description}</p>
      )}
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold text-slate-900">{price}</span>
        <button className="text-orange-500 hover:text-orange-600 font-semibold">
          Learn More →
        </button>
      </div>
    </div>
  );
}

