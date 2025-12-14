'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import all Leaflet components to avoid SSR issues
const MapComponent = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600 text-sm">Loading map...</p>
      </div>
    )
  }
);

interface LocationMapProps {
  location: string;
  venue?: string;
  coordinates?: { lat: number; lng: number };
  className?: string;
}

export default function LocationMap({ location, venue, coordinates, className = '' }: LocationMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string>('');

  const displayLocation = venue || location;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const geocodeAddress = async (address: string) => {
      try {
        // Use Nominatim (OpenStreetMap geocoding service) - free, no API key required
        // Add User-Agent header as required by Nominatim usage policy
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'ChessTourneys/1.0 (https://chessklub.com)',
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lon)) {
            setMapCenter([lat, lon]);
            setGeocodingError('');
            return;
          }
        }
        
        // If geocoding failed, try with a simplified address (just city/state)
        const simplifiedAddress = address.split(',').slice(-2).join(',').trim();
        if (simplifiedAddress && simplifiedAddress !== address) {
          const retryResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(simplifiedAddress)}&limit=1`,
            {
              headers: {
                'User-Agent': 'ChessTourneys/1.0 (https://chessklub.com)',
              },
            }
          );
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            if (retryData && retryData.length > 0) {
              const lat = parseFloat(retryData[0].lat);
              const lon = parseFloat(retryData[0].lon);
              if (!isNaN(lat) && !isNaN(lon)) {
                setMapCenter([lat, lon]);
                setGeocodingError('');
                return;
              }
            }
          }
        }
        
        // If all geocoding attempts failed, show error but still allow Google Maps link
        setGeocodingError('Map preview unavailable');
      } catch (err) {
        console.error('Geocoding error:', err);
        setGeocodingError('Map preview unavailable');
      }
    };

    // If coordinates are provided, use them directly
    if (coordinates && coordinates.lat && coordinates.lng) {
      setMapCenter([coordinates.lat, coordinates.lng]);
      setGeocodingError('');
    } else if (displayLocation) {
      // Otherwise, geocode the address
      geocodeAddress(displayLocation);
    }
  }, [coordinates, displayLocation]);

  // Show loading state or error state
  if (!isClient) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-600 text-sm">Loading map...</p>
      </div>
    );
  }

  // If geocoding failed or no map center, show fallback with Google Maps link
  if (!mapCenter || geocodingError) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        {geocodingError && (
          <p className="text-gray-600 text-sm mb-3">{geocodingError}</p>
        )}
        {displayLocation && (
          <>
            <p className="text-gray-700 text-sm font-medium mb-3">{displayLocation}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayLocation)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Open in Google Maps
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 shadow-sm ${className}`}>
      <div className="relative w-full" style={{ height: '300px' }}>
        <MapComponent
          center={mapCenter}
          zoom={coordinates ? 15 : 13}
          location={displayLocation}
        />
      </div>
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-700 font-medium mb-1">{displayLocation}</p>
        <div className="flex gap-3">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayLocation)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-600 hover:text-orange-700"
          >
            Open in Google Maps →
          </a>
          {coordinates && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${coordinates.lat}&mlon=${coordinates.lng}&zoom=15`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-600 hover:text-gray-700"
            >
              Open in OpenStreetMap →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

