import Link from 'next/link';

interface EventCardProps {
  id?: string;
  title: string;
  date: string;
  location: string;
  price: string;
  image?: string;
  description?: string;
  category?: string;
}

export default function EventCard({ 
  id,
  title, 
  date, 
  location, 
  price, 
  image,
  description,
  category
}: EventCardProps) {
  // Format price - add $ if it's a number without currency symbol
  const formatPrice = (priceStr: string) => {
    if (!priceStr) return 'Free';
    // If price doesn't start with $, £, €, or other currency symbols, add $
    if (!/^[\$£€¥₹]/.test(priceStr.trim())) {
      // Check if it's a number
      const numPrice = parseFloat(priceStr.trim());
      if (!isNaN(numPrice)) {
        return `$${numPrice}`;
      }
    }
    return priceStr;
  };

  // Link to detail page - all events/tournaments use the same detail page
  const getEventLink = () => {
    if (!id) return '/all';
    return `/events/${id}`;
  };

  const cardContent = (
    <div 
      className="rounded-lg overflow-hidden hover:shadow-xl transition flex flex-col cursor-pointer h-full"
      style={{
        backgroundColor: 'var(--color-light)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      {/* Image - Full width, taller */}
      {image ? (
        <div className="w-full h-64 overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
          <span className="text-white text-lg font-bold text-center px-4">{title}</span>
        </div>
      )}
      
      {/* Compact Text Section */}
      <div className="p-5 flex flex-col">
        <h3 
          className="text-lg font-bold mb-3 line-clamp-1"
          style={{ 
            color: 'var(--color-dark)',
            fontFamily: 'var(--font-heading)'
          }}
        >
          {title}
        </h3>
        
        {/* Single line for date, location, price */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--color-accent)' }}>
              {date}
            </span>
            <span className="text-gray-600 truncate text-sm">📍 {location}</span>
          </div>
          <span 
            className="text-xl font-bold whitespace-nowrap ml-2"
            style={{ color: 'var(--color-accent)' }}
          >
            {formatPrice(price)}
          </span>
        </div>
      </div>
    </div>
  );

  // Wrap in Link if id exists
  if (id) {
    return (
      <Link href={getEventLink()} className="block h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

