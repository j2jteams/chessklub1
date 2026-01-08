'use client';

import { useState, useRef, useEffect } from 'react';

interface LocationAutocompleteProps {
  onPlaceSelect: (place: {
    placeId?: string;
    coordinates: { lat: number; lng: number };
    formattedAddress: string;
    addressComponents: {
      longName: string;
      shortName: string;
      types: string[];
    }[];
  }) => void;
  value?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
  onInputChange?: (value: string) => void; // Callback for when user types
}

/**
 * Location Autocomplete Component
 * 
 * Uses Google Places Autocomplete API (requires GOOGLE_PLACES_API_KEY in env)
 * Falls back to basic text input if API key not available
 * 
 * To enable:
 * 1. Add GOOGLE_PLACES_API_KEY to .env.local
 * 2. Enable Places API in Google Cloud Console
 * 3. Add script to layout or use @react-google-maps/api
 */
export default function LocationAutocomplete({
  onPlaceSelect,
  value = '',
  placeholder = 'Search for a location...',
  className = '',
  required = false,
  onInputChange
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initAttemptedRef = useRef<boolean>(false);

  // Sync value prop with internal state
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Cleanup debounce and timeouts on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Check if Google Maps API is available
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Prevent multiple initialization attempts
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    // Check if API key exists
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Debug: Log API key status (first 10 chars only for security)
    if (apiKey) {
      console.log('✅ Google Maps API key found:', apiKey.substring(0, 10) + '...');
    } else {
      console.warn('⚠️ Google Maps API key not found. Check .env.local file.');
      console.warn('Expected: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_PLACES_API_KEY');
      setLoadError('API key not configured');
      // Set a timeout to stop showing loading after 5 seconds
      loadingTimeoutRef.current = setTimeout(() => {
        setIsGoogleLoaded(false); // Stop showing loading state
      }, 5000);
      return;
    }

    // Helper function to initialize services
    const initializeServices = () => {
      try {
        if ((window as any).google?.maps?.places) {
          autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
          placesServiceRef.current = new (window as any).google.maps.places.PlacesService(
            document.createElement('div')
          );
          setIsGoogleLoaded(true);
          console.log('✅ Google Places services initialized');
          return true;
        }
        return false;
      } catch (error) {
        console.error('❌ Error initializing Google Places services:', error);
        return false;
      }
    };

    // If Google Maps is already loaded, initialize services immediately
    if (initializeServices()) {
      return;
    }

    // Check if script is already being loaded or exists
    const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    
    if (existingScript) {
      // Script is already in the document, wait for it to load
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds max
      const checkGoogleLoaded = setInterval(() => {
        attempts++;
        if (initializeServices()) {
          clearInterval(checkGoogleLoaded);
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        } else if (attempts >= maxAttempts) {
          clearInterval(checkGoogleLoaded);
          console.warn('⚠️ Google Maps script exists but Places API not loading after 10 seconds');
          setLoadError('Places API failed to initialize');
          setIsGoogleLoaded(false); // Stop showing loading state
        }
      }, 100);
      
      // Set timeout to stop loading state after 12 seconds
      loadingTimeoutRef.current = setTimeout(() => {
        clearInterval(checkGoogleLoaded);
        setIsGoogleLoaded(false);
        if (!autocompleteServiceRef.current) {
          setLoadError('Places API timeout - check API key and billing');
        }
      }, 12000);
      return;
    }

    // Script doesn't exist, create and load it
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Google Maps script loaded successfully');
      // Give it a moment for Google to initialize
      setTimeout(() => {
        if (initializeServices()) {
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        } else {
          // Try a few more times with increasing delays
          let retries = 0;
          const maxRetries = 5;
          const retryInterval = setInterval(() => {
            retries++;
            if (initializeServices() || retries >= maxRetries) {
              clearInterval(retryInterval);
              if (!autocompleteServiceRef.current) {
                setLoadError('Places API failed to initialize');
                setIsGoogleLoaded(false);
              } else if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
              }
            }
          }, 200);
        }
      }, 100);
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps API:', error);
      console.error('Check your API key and ensure Places API is enabled in Google Cloud Console');
      setLoadError('Failed to load Google Maps API - check API key and Places API');
      setIsGoogleLoaded(false);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
    document.head.appendChild(script);
    
    // Set timeout to stop loading state after 15 seconds
    loadingTimeoutRef.current = setTimeout(() => {
      if (!isGoogleLoaded && !autocompleteServiceRef.current) {
        setLoadError('Loading timeout - check API key and network connection');
        setIsGoogleLoaded(false);
      }
      }, 15000);
  }, []); // Empty deps - only run once on mount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    
    // Notify parent component of input change
    if (onInputChange) {
      onInputChange(query);
    }

    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      // Clear any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      return;
    }

    // If Google not loaded yet, try to initialize again
    if (!isGoogleLoaded || !autocompleteServiceRef.current) {
      // Try to initialize if Google is now available
      if ((window as any).google?.maps?.places && !autocompleteServiceRef.current) {
        try {
          autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
          placesServiceRef.current = new (window as any).google.maps.places.PlacesService(
            document.createElement('div')
          );
          setIsGoogleLoaded(true);
          console.log('✅ Google Places services initialized (late init)');
        } catch (error) {
          console.warn('⚠️ Google Places API not ready yet. Suggestions will appear once API loads.');
          return;
        }
      } else {
        console.warn('⚠️ Google Places API not ready yet. Suggestions will appear once API loads.');
        return;
      }
    }

    // Clear previous debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce autocomplete requests (wait 300ms after user stops typing)
    debounceTimeoutRef.current = setTimeout(() => {
      // Request autocomplete suggestions
      try {
        if (!autocompleteServiceRef.current) {
          console.warn('⚠️ AutocompleteService not available');
          return;
        }

        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: query,
            types: ['establishment', 'geocode'],
            componentRestrictions: { country: [] } // No country restriction
          },
          (predictions: any[], status: string) => {
            if (!(window as any).google?.maps?.places) {
              console.error('❌ Google Maps Places API not available');
              return;
            }

            const PlacesServiceStatus = (window as any).google.maps.places.PlacesServiceStatus;
            
            if (status === PlacesServiceStatus.OK && predictions && predictions.length > 0) {
              console.log('📍 Autocomplete suggestions received:', predictions.length);
              setSuggestions(predictions);
              setShowSuggestions(true);
            } else if (status === PlacesServiceStatus.ZERO_RESULTS) {
              console.log('📍 No suggestions found for:', query);
              setSuggestions([]);
              setShowSuggestions(false);
            } else if (status === PlacesServiceStatus.REQUEST_DENIED) {
              console.error('❌ Google Places API request denied. Check API key and billing.');
              setSuggestions([]);
              setShowSuggestions(false);
            } else if (status === PlacesServiceStatus.OVER_QUERY_LIMIT) {
              console.warn('⚠️ Google Places API quota exceeded');
              setSuggestions([]);
              setShowSuggestions(false);
            } else {
              console.warn('⚠️ Autocomplete status:', status);
              setSuggestions([]);
              setShowSuggestions(false);
            }
          }
        );
      } catch (error) {
        console.error('❌ Error requesting autocomplete:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
      debounceTimeoutRef.current = null;
    }, 300);
  };

  const handlePlaceSelect = (placeId: string, description: string) => {
    setIsSelecting(true);
    setInputValue(description);
    setShowSuggestions(false);
    setSuggestions([]);

    if (!isGoogleLoaded || !placesServiceRef.current) {
      console.warn('⚠️ Google Places API not loaded. Using description only.');
      // Fallback: try to extract coordinates from description or use geocoding
      onPlaceSelect({
        coordinates: { lat: 0, lng: 0 }, // Will need manual entry or geocoding
        formattedAddress: description,
        addressComponents: []
      });
      setIsSelecting(false);
      return;
    }

    // Get place details
    try {
      placesServiceRef.current.getDetails(
        {
          placeId: placeId,
          fields: ['geometry', 'formatted_address', 'address_components', 'place_id']
        },
        (place: any, status: string) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
            const coordinates = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            };

            const addressComponents = place.address_components?.map((component: any) => ({
              longName: component.long_name,
              shortName: component.short_name,
              types: component.types
            })) || [];

            console.log('✅ Place selected:', place.formatted_address);
            onPlaceSelect({
              placeId: place.place_id,
              coordinates,
              formattedAddress: place.formatted_address || description,
              addressComponents
            });
          } else {
            console.error('❌ Failed to get place details:', status);
            // Fallback to description
            onPlaceSelect({
              coordinates: { lat: 0, lng: 0 },
              formattedAddress: description,
              addressComponents: []
            });
          }
          setIsSelecting(false);
        }
      );
    } catch (error) {
      console.error('❌ Error getting place details:', error);
      onPlaceSelect({
        coordinates: { lat: 0, lng: 0 },
        formattedAddress: description,
        addressComponents: []
      });
      setIsSelecting(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    if (!suggestion || !suggestion.place_id) {
      console.error('❌ Invalid suggestion:', suggestion);
      return;
    }
    handlePlaceSelect(suggestion.place_id, suggestion.description);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={autocompleteRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={(e) => {
          // Don't close if clicking on a suggestion
          const relatedTarget = e.relatedTarget as Node;
          if (suggestionsRef.current && relatedTarget && suggestionsRef.current.contains(relatedTarget)) {
            return;
          }
          // Delay to allow click on suggestion to register
          setTimeout(() => {
            if (!isSelecting) {
              setShowSuggestions(false);
            }
          }, 250);
        }}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          onMouseDown={(e) => {
            // Prevent input blur when clicking inside dropdown
            e.preventDefault();
          }}
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.place_id || index}
              type="button"
              onMouseDown={(e) => {
                // Prevent input blur from firing before click
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSuggestionClick(suggestion);
              }}
              onTouchStart={(e) => {
                // Handle touch devices
                e.preventDefault();
                handleSuggestionClick(suggestion);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
            >
              <div className="font-medium text-gray-900">{suggestion.structured_formatting.main_text}</div>
              <div className="text-sm text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
            </button>
          ))}
        </div>
      )}

      {!isGoogleLoaded && !loadError && (
        <p className="text-xs text-gray-500 mt-1">
          {process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            ? '⏳ Loading Google Maps API... (suggestions will appear once loaded)'
            : '⚠️ Enter location manually. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local and restart server'}
        </p>
      )}
      
      {loadError && (
        <p className="text-xs text-red-600 mt-1">
          ⚠️ {loadError}. You can still enter the location manually.
        </p>
      )}
      
      {isGoogleLoaded && inputValue.trim() && !showSuggestions && suggestions.length === 0 && inputValue.length >= 2 && (
        <p className="text-xs text-gray-400 mt-1">
          💡 Keep typing to see location suggestions...
        </p>
      )}

      {isGoogleLoaded && inputValue.trim() && inputValue.length < 2 && (
        <p className="text-xs text-gray-400 mt-1">
          Type at least 2 characters to see suggestions
        </p>
      )}
    </div>
  );
}

