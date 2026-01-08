'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function MerchandisePage() {
  const products = [
    {
      id: 1,
      name: 'Chess Tourneys T-Shirt',
      price: '$24.99',
      image: '👕',
      description: 'Comfortable cotton t-shirt with Chess Tourneys logo',
    },
    {
      id: 2,
      name: 'Chess Set - Tournament Style',
      price: '$49.99',
      image: '♟️',
      description: 'Professional tournament-style chess set with weighted pieces',
    },
    {
      id: 3,
      name: 'Chess Tourneys Hoodie',
      price: '$39.99',
      image: '🧥',
      description: 'Warm and cozy hoodie perfect for chess sessions',
    },
    {
      id: 4,
      name: 'Chess Clock',
      price: '$34.99',
      image: '⏱️',
      description: 'Digital chess clock for tournament play',
    },
    {
      id: 5,
      name: 'Chess Tourneys Cap',
      price: '$19.99',
      image: '🧢',
      description: 'Stylish cap with embroidered Chess Tourneys logo',
    },
    {
      id: 6,
      name: 'Chess Board - Roll-up',
      price: '$29.99',
      image: '📐',
      description: 'Portable roll-up chess board for practice anywhere',
    },
    {
      id: 7,
      name: 'Chess Books Bundle',
      price: '$59.99',
      image: '📚',
      description: 'Collection of essential chess strategy books',
    },
    {
      id: 8,
      name: 'Chess Tourneys Water Bottle',
      price: '$14.99',
      image: '💧',
      description: 'Insulated water bottle with Chess Tourneys branding',
    },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 chess-themed-bg">
        {/* Hero Section */}
        <div 
          className="text-white py-12"
          style={{ 
            backgroundColor: 'var(--color-dark)',
            paddingTop: 'var(--space-md)',
            paddingBottom: 'var(--space-md)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 
              className="mb-4 font-bold"
              style={{ 
                fontSize: 'var(--font-size-h2)',
                color: 'var(--color-light)',
                fontFamily: 'var(--font-heading)'
              }}
            >
              Chess Tourneys Store
            </h1>
            <p 
              className="text-lg"
              style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: 'var(--font-body)'
              }}
            >
              Official merchandise and chess equipment
            </p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center text-6xl">
                  {product.image}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-orange-500">{product.price}</span>
                    <button className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-md transition">
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <p className="text-blue-800">
              <strong>Note:</strong> Online store coming soon! For now, please contact us at{' '}
              <a href="mailto:support@chesstourneys.com" className="text-orange-500 hover:underline">
                support@chesstourneys.com
              </a>{' '}
              or call (704) 248-6999 to place an order.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

