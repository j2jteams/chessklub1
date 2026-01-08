'use client';

import { useEffect, useRef, useState } from 'react';

interface GoogleMapComponentProps {
  center: [number, number];
  zoom: number;
  location: string;
}

export default function GoogleMapComponent({ center, zoom, location }: GoogleMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load Google Maps API
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if Google Maps is already loaded
    if ((window as any).google?.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}&libraries=places`;
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    
    if (existingScript) {
      // Script is already in the document, wait for it to load
      const checkGoogleLoaded = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(checkGoogleLoaded);
          setIsLoaded(true);
        }
      }, 100);
      setTimeout(() => clearInterval(checkGoogleLoaded), 10000);
      return;
    }

    // Check if API key exists
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      setLoadError('Google Maps API key not configured');
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(true);
    };
    script.onerror = () => {
      setLoadError('Failed to load Google Maps API');
    };
    document.head.appendChild(script);
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    try {
      const google = (window as any).google;
      if (!google?.maps) return;

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: center[0], lng: center[1] },
        zoom: zoom,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
      });

      setMap(mapInstance);

      // Add marker
      const markerInstance = new google.maps.Marker({
        position: { lat: center[0], lng: center[1] },
        map: mapInstance,
        title: location,
      });

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px;"><p style="font-weight: 600; margin: 0;">${location}</p></div>`,
      });

      markerInstance.addListener('click', () => {
        infoWindow.open(mapInstance, markerInstance);
      });

      setMarker(markerInstance);
    } catch (error) {
      console.error('Error initializing Google Map:', error);
      setLoadError('Failed to initialize map');
    }
  }, [isLoaded, center, zoom, location]);

  // Update map center when coordinates change
  useEffect(() => {
    if (map && center) {
      map.setCenter({ lat: center[0], lng: center[1] });
      if (marker) {
        marker.setPosition({ lat: center[0], lng: center[1] });
      }
    }
  }, [map, marker, center]);

  if (loadError) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 text-sm">{loadError}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 text-sm">Loading map...</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ height: '100%', width: '100%', minHeight: '300px' }}
    />
  );
}

