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
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setMapCenter([lat, lon]);
          setGeocodingError('');
        } else {
          setGeocodingError('Location not found');
        }
      } catch (err) {
        console.error('Geocoding error:', err);
        setGeocodingError('Unable to geocode address');
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

  // Show loading state
  if (!isClient || !mapCenter) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        {geocodingError ? (
          <>
            <p className="text-gray-600 text-sm mb-2">{geocodingError}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayLocation)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-600 hover:text-orange-700 inline-block"
            >
              Open in Google Maps →
            </a>
          </>
        ) : (
          <p className="text-gray-600 text-sm">Loading map...</p>
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

