'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LocationsPage() {
  const locations = [
    {
      name: 'Ballantyne',
      address: '14045 Ballantyne Corporate Pl, Ste 101',
      city: 'Charlotte, NC 28277',
      phone: '(980) 300-6968',
      email: 'ballantyne@chessklub.com',
      hours: {
        weekdays: 'Mon - Fri: 4 to 8 pm',
        weekends: 'Sat & Sun: Closed',
      },
    },
    {
      name: 'Fort Mill',
      address: '852 Gold Hill Road, #101',
      city: 'Fort Mill, SC 29708',
      phone: '(704) 248-6999',
      email: 'fortmill@chessklub.com',
      hours: {
        weekdays: 'Mon - Fri: 4 to 8 pm',
        weekends: 'Sat & Sun: Closed',
      },
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
              Our Locations
            </h1>
            <p 
              className="text-lg"
              style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: 'var(--font-body)'
              }}
            >
              Find a CHESS KLUB location near you
            </p>
          </div>
        </div>

        {/* Locations Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {locations.map((location, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-8 hover:shadow-xl transition-shadow">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">{location.name}</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Address</h3>
                    <p className="text-gray-800">{location.address}</p>
                    <p className="text-gray-800">{location.city}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Phone</h3>
                    <a href={`tel:${location.phone.replace(/[^0-9]/g, '')}`} className="text-orange-500 hover:text-orange-600">
                      {location.phone}
                    </a>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Email</h3>
                    <a href={`mailto:${location.email}`} className="text-orange-500 hover:text-orange-600">
                      {location.email}
                    </a>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Hours</h3>
                    <p className="text-gray-800">{location.hours.weekdays}</p>
                    <p className="text-gray-800">{location.hours.weekends}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-md transition">
                    Get Directions
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Headquarters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Address</h3>
                <p className="text-gray-800">14045 Ballantyne Corporate Pl, Ste 101</p>
                <p className="text-gray-800">Charlotte, NC 28277</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Contact</h3>
                <p className="text-gray-800">
                  <a href="mailto:hello@chessklub.com" className="text-orange-500 hover:text-orange-600">
                    hello@chessklub.com
                  </a>
                </p>
                <p className="text-gray-800">
                  <a href="tel:7042486999" className="text-orange-500 hover:text-orange-600">
                    (704) 248-6999
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="mt-8 bg-gray-200 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-500">Map integration coming soon</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

