// Type definitions for Google Maps JavaScript API
// These types are available when Google Maps script is loaded

declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setCenter(latlng: LatLng | LatLngLiteral): void;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setPosition(latlng: LatLng | LatLngLiteral): void;
      addListener(event: string, handler: Function): void;
    }

    class InfoWindow {
      constructor(options?: InfoWindowOptions);
      open(map?: Map, marker?: Marker): void;
      setContent(content: string | HTMLElement): void;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      scaleControl?: boolean;
      streetViewControl?: boolean;
      rotateControl?: boolean;
      fullscreenControl?: boolean;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
    }

    interface InfoWindowOptions {
      content?: string | HTMLElement;
    }

    interface LatLng {
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    namespace places {
      class AutocompleteService {
        getPlacePredictions(
          request: AutocompletionRequest,
          callback: (predictions: PlacePrediction[] | null, status: PlacesServiceStatus) => void
        ): void;
      }

      class PlacesService {
        constructor(container: HTMLElement);
        getDetails(
          request: PlaceDetailsRequest,
          callback: (place: PlaceResult | null, status: PlacesServiceStatus) => void
        ): void;
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
      }

      interface AutocompletionRequest {
        input: string;
        types?: string[];
        componentRestrictions?: { country: string[] | string };
      }

      interface PlacePrediction {
        place_id: string;
        description: string;
        structured_formatting: {
          main_text: string;
          secondary_text: string;
        };
      }

      interface PlaceDetailsRequest {
        placeId: string;
        fields?: string[];
      }

      interface PlaceResult {
        place_id: string;
        formatted_address: string;
        geometry: {
          location: LatLng;
        };
        address_components?: AddressComponent[];
      }

      interface AddressComponent {
        long_name: string;
        short_name: string;
        types: string[];
      }
    }
  }
}

