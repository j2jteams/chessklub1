'use client';

// UPDATED: Unified event form component with sections and add-ons support
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createEvent, updateEvent } from '@/lib/events';
import { uploadImage } from '@/lib/storage';
import { EventType, EventStatus, EventAddOn, TournamentSection, ChessEvent, PricingTier, UserData, TimeControl } from '@/lib/types';
import { getAllUsers, getFranchisees } from '@/lib/userRoles';
import { Timestamp } from 'firebase/firestore';
import LocationAutocomplete from './LocationAutocomplete';
import { normalizeLocation } from '@/lib/locationNormalizer';

interface ChessEventFormProps {
  initialData?: ChessEvent | null; // for edit mode
  mode: 'create' | 'edit';
  onSaveSuccess?: (eventId: string) => void;
}

export default function ChessEventForm({ initialData, mode, onSaveSuccess }: ChessEventFormProps) {
  const { user, role } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [franchisees, setFranchisees] = useState<UserData[]>([]);
  const [loadingFranchisees, setLoadingFranchisees] = useState(false);
  
  // Event linking state
  const [eventLinkType, setEventLinkType] = useState<'franchise' | 'standalone'>('standalone');
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>('');
  const [franchiseIdInput, setFranchiseIdInput] = useState<string>('');
  
  // Unified form state
  const [formData, setFormData] = useState({
    type: 'tournament' as EventType,
    name: '',
    description: '',
    venue: '', // Legacy field - kept for backward compatibility
    venueType: 'In-person' as 'Online' | 'In-person',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    checkInTime: '',
    timeControlCategory: '' as '' | 'Classical' | 'Rapid' | 'Blitz' | 'Other',
    timeControlFormat: '',
    timeControlCustomLabel: '',
    ratingType: '' as '' | 'FIDE' | 'USCF' | 'Club',
    pricingTiers: [] as PricingTier[],
    sections: [] as TournamentSection[],
    addOns: [] as EventAddOn[],
    image: '', // This will be mapped to both image and heroImageUrl
    contactEmail: '',
    contactPhone: '',
    ageLimit: '',
    equipmentProvided: '',
    coordinates: { lat: '', lng: '' },
    // Structured location fields
    locationVenueName: '',
    locationAddressLine1: '',
    locationAddressLine2: '',
    locationCity: '',
    locationAdmin1: '', // State/Province
    locationPostalCode: '',
    locationCountryCode: '',
    locationAutocompleteResult: null as any,
    locationSearchQuery: '', // Track the search input separately
  });
  

  // Load franchisees for dropdown (only in create mode)
  useEffect(() => {
    if (mode === 'create') {
      const loadFranchisees = async () => {
        setLoadingFranchisees(true);
        try {
          // Use getFranchisees() which works for standalone admins (queries with where clause)
          // Fallback to getAllUsers() for super admins if needed
          const userRole = role ?? 'player';
          if (userRole === 'superAdmin') {
            // Super Admin can use getAllUsers (has full access)
            const allUsers = await getAllUsers();
            const franchiseeUsers = allUsers.filter(u => u.role === 'franchisee');
            setFranchisees(franchiseeUsers);
          } else {
            // Standalone Admin and Franchisee use getFranchisees (limited access)
            const franchiseeUsers = await getFranchisees();
            setFranchisees(franchiseeUsers);
          }
        } catch (error) {
          console.error('Error loading franchisees:', error);
          // If loading fails (e.g., permission denied or missing index), set empty array
          // The dropdown will still show with manual input option
          setFranchisees([]);
        } finally {
          setLoadingFranchisees(false);
        }
        
        // Set default based on user role (do this after loading attempt)
        const userRole = role ?? 'player';
        if (userRole === 'franchisee') {
          // Franchisee: default to "Linked to Franchise" with their own ID
          setEventLinkType('franchise');
          setSelectedFranchiseId(user?.uid || '');
          setFranchiseIdInput(user?.uid || '');
        } else if (userRole === 'standaloneAdmin') {
          // Standalone Admin: default to "Standalone"
          setEventLinkType('standalone');
        } else if (userRole === 'superAdmin') {
          // Super Admin: default to "Standalone" but can choose
          setEventLinkType('standalone');
        }
      };
      loadFranchisees();
    }
  }, [mode, role, user]);

  // Load initial data for edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      // Convert ChessEvent to form data
      const startDateStr = initialData.startDate 
        ? (initialData.startDate instanceof Date 
            ? initialData.startDate.toISOString().split('T')[0]
            : initialData.startDate.toDate 
            ? initialData.startDate.toDate().toISOString().split('T')[0]
            : typeof initialData.startDate === 'string'
            ? initialData.startDate.split('T')[0]
            : '')
        : '';
      
      const endDateStr = initialData.endDate
        ? (initialData.endDate instanceof Date
            ? initialData.endDate.toISOString().split('T')[0]
            : initialData.endDate.toDate
            ? initialData.endDate.toDate().toISOString().split('T')[0]
            : typeof initialData.endDate === 'string'
            ? initialData.endDate.split('T')[0]
            : '')
        : '';

      // Parse time from initialData.time or set defaults
      let startTimeStr = '';
      let endTimeStr = '';
      if (initialData.time) {
        // Try to parse "10:00 AM - 5:00 PM" format
        const timeMatch = initialData.time.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))(?:\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM)))?/i);
        if (timeMatch) {
          startTimeStr = timeMatch[1] || '';
          endTimeStr = timeMatch[2] || '';
        } else {
          // If single time, use as start time
          startTimeStr = initialData.time;
        }
      }

      // Parse pricing tiers from initialData or create from legacy price
      let pricingTiers: PricingTier[] = initialData.pricingTiers || [];
      
      // If no pricing tiers but legacy price exists, create a default tier
      if (pricingTiers.length === 0 && initialData.price) {
        const priceMatch = initialData.price.toString().replace('$', '').trim();
        const priceNum = parseFloat(priceMatch);
        if (!isNaN(priceNum) && priceNum > 0) {
          pricingTiers = [{
            id: `tier-${Date.now()}`,
            name: 'Standard',
            price: priceNum,
            description: '',
          }];
        }
      }

      // Determine mode of play from initialData (use type assertion for optional fields)
      const data = initialData as any; // Type assertion to access optional fields
      const venueType = data.venueType || 
        (initialData.coordinates || (initialData.venue && !initialData.venue.toLowerCase().includes('online')) 
          ? 'In-person' 
          : 'Online');

      setFormData({
        type: initialData.type || 'tournament',
        name: initialData.name || initialData.title || '',
        description: initialData.description || '',
        venue: initialData.venue || initialData.location || '',
        venueType: venueType as 'Online' | 'In-person',
        startDate: startDateStr,
        endDate: endDateStr,
        startTime: initialData.startTime || startTimeStr,
        endTime: initialData.endTime || endTimeStr,
        checkInTime: data.checkInTime || '',
        // Parse timeControl - handle both new object format and legacy string
        timeControlCategory: (() => {
          if (initialData.timeControl && typeof initialData.timeControl === 'object') {
            return initialData.timeControl.category || '';
          } else if (typeof initialData.timeControl === 'string') {
            // Legacy: try to match string to category
            const tc = initialData.timeControl.trim();
            if (['Classical', 'Rapid', 'Blitz', 'Other'].includes(tc)) {
              return tc as 'Classical' | 'Rapid' | 'Blitz' | 'Other';
            }
          }
          return '';
        })(),
        timeControlFormat: (() => {
          if (initialData.timeControl && typeof initialData.timeControl === 'object') {
            return initialData.timeControl.format || '';
          }
          return '';
        })(),
        timeControlCustomLabel: (() => {
          if (initialData.timeControl && typeof initialData.timeControl === 'object') {
            return initialData.timeControl.customLabel || '';
          }
          return '';
        })(),
        ratingType: (initialData.ratingType || '') as '' | 'FIDE' | 'USCF' | 'Club',
        pricingTiers: pricingTiers,
        sections: initialData.sections || [],
        addOns: initialData.addOns || [],
        image: data.heroImageUrl || initialData.image || '', // Use heroImageUrl if available, fallback to image
        contactEmail: initialData.contactEmail || '',
        contactPhone: initialData.contactPhone || '',
        ageLimit: data.ageLimit || '',
        equipmentProvided: data.equipmentProvided || '',
        coordinates: initialData.coordinates 
          ? { lat: String(initialData.coordinates.lat), lng: String(initialData.coordinates.lng) }
          : { lat: '', lng: '' },
        // Structured location fields
        locationVenueName: initialData.structuredLocation?.venueName || '',
        locationAddressLine1: initialData.structuredLocation?.addressLine1 || '',
        locationAddressLine2: initialData.structuredLocation?.addressLine2 || '',
        locationCity: initialData.structuredLocation?.city || '',
        locationAdmin1: initialData.structuredLocation?.admin1 || '',
        locationPostalCode: initialData.structuredLocation?.postalCode || '',
        locationCountryCode: initialData.structuredLocation?.countryCode || '',
        locationAutocompleteResult: null,
        locationSearchQuery: initialData.venue || initialData.location || '',
      });

      if (initialData.image) {
        setImagePreview(initialData.image);
      }
    }
  }, [mode, initialData]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type - only accept common image formats
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, WebP, or GIF only)');
      return;
    }

    // Validate file size - limit to 5MB
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Image size must be less than 5MB. Please compress your image or use a smaller file.');
      return;
    }

    setError('');
    setUploadingImage(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const imageUrl = await uploadImage(file);
      setFormData({ ...formData, image: imageUrl }); // Will be mapped to both image and heroImageUrl on save
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, image: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Pricing tier management
  const addPricingTier = () => {
    const newTier: PricingTier = {
      id: `tier-${Date.now()}-${Math.random()}`,
      name: '',
      price: 0,
      description: '',
      countryCode: '', // Optional: leave empty for global pricing, or set to specific country (e.g., "IN" for India)
      currency: 'USD', // Default to USD
    };
    setFormData({ ...formData, pricingTiers: [...formData.pricingTiers, newTier] });
  };

  const removePricingTier = (index: number) => {
    setFormData({
      ...formData,
      pricingTiers: formData.pricingTiers.filter((_, i) => i !== index),
    });
  };

  const updatePricingTier = (index: number, field: keyof PricingTier, value: string | number) => {
    const updatedTiers = [...formData.pricingTiers];
    const currentTier = updatedTiers[index] || { id: '', name: '', price: 0, description: '', currency: 'USD' };
    
    if (field === 'name' || field === 'description' || field === 'countryCode' || field === 'currency') {
      updatedTiers[index] = {
        ...currentTier,
        [field]: typeof value === 'string' ? value : String(value || ''),
      };
    } else if (field === 'price') {
      // Parse and validate price - ensure it's a valid number
      let priceValue: number;
      if (typeof value === 'number') {
        priceValue = value;
      } else if (typeof value === 'string') {
        // Trim and parse - handle empty strings
        const trimmed = value.trim();
        if (trimmed === '') {
          priceValue = 0;
        } else {
          const parsed = parseFloat(trimmed);
          priceValue = isNaN(parsed) ? 0 : parsed;
        }
      } else {
        priceValue = 0;
      }
      
      // Round to 2 decimal places to avoid floating point precision issues
      // Use a more precise rounding method to avoid 500 becoming 499.99
      priceValue = Math.round(priceValue * 100 + Number.EPSILON) / 100;
      
      // If the value is very close to a whole number (within 0.001), round to whole number
      // This prevents 499.99999999999994 from being stored as 499.99
      const nearestWhole = Math.round(priceValue);
      if (Math.abs(priceValue - nearestWhole) < 0.001) {
        priceValue = nearestWhole;
      }
      
      updatedTiers[index] = {
        ...currentTier,
        price: priceValue,
      };
    } else if (field === 'id') {
      updatedTiers[index] = {
        ...currentTier,
        id: typeof value === 'string' ? value : String(value || ''),
      };
    }
    
    setFormData({ ...formData, pricingTiers: updatedTiers });
  };

  // Section management
  const addSection = () => {
    const newSection: TournamentSection = {
      id: `section-${Date.now()}-${Math.random()}`,
      name: '',
      minRating: null,
      maxRating: null,
      entryFee: null,
    };
    setFormData({ ...formData, sections: [...formData.sections, newSection] });
  };

  const removeSection = (index: number) => {
    setFormData({
      ...formData,
      sections: formData.sections.filter((_, i) => i !== index),
    });
  };

  const updateSection = (index: number, field: keyof TournamentSection, value: string | number | null) => {
    const updatedSections = [...formData.sections];
    const currentSection = updatedSections[index] || { id: '', name: '', minRating: null, maxRating: null, entryFee: null };
    
    if (field === 'name') {
      updatedSections[index] = {
        ...currentSection,
        name: typeof value === 'string' ? value : String(value || ''),
      };
    } else if (field === 'minRating' || field === 'maxRating' || field === 'entryFee') {
      updatedSections[index] = {
        ...currentSection,
        [field]: value === '' || value === null ? null : (typeof value === 'string' ? (parseFloat(value) || null) : (typeof value === 'number' ? value : null)),
      };
    } else if (field === 'id') {
      updatedSections[index] = {
        ...currentSection,
        id: typeof value === 'string' ? value : String(value || ''),
      };
    } else {
      updatedSections[index] = {
        ...currentSection,
        [field]: value as any,
      };
    }
    
    setFormData({ ...formData, sections: updatedSections });
  };

  // Add-on management
  const addAddOn = () => {
    const newAddOn: EventAddOn = {
      id: `addon-${Date.now()}-${Math.random()}`,
      name: '',
      description: '',
      price: null,
      isRequired: false,
      appliesToSections: [],
    };
    setFormData({ ...formData, addOns: [...formData.addOns, newAddOn] });
  };

  const removeAddOn = (index: number) => {
    setFormData({
      ...formData,
      addOns: formData.addOns.filter((_, i) => i !== index),
    });
  };

  const updateAddOn = (index: number, field: keyof EventAddOn, value: any) => {
    const updatedAddOns = [...formData.addOns];
    const currentAddOn = updatedAddOns[index] || { id: '', name: '', description: '', price: null, isRequired: false, appliesToSections: [] };
    
    if (field === 'name' || field === 'description') {
      updatedAddOns[index] = {
        ...currentAddOn,
        [field]: typeof value === 'string' ? value : String(value || ''),
      };
    } else if (field === 'price') {
      updatedAddOns[index] = {
        ...currentAddOn,
        price: value === '' || value === null ? null : (typeof value === 'string' ? (parseFloat(value) || null) : (typeof value === 'number' ? value : null)),
      };
    } else if (field === 'isRequired') {
      updatedAddOns[index] = {
        ...currentAddOn,
        isRequired: Boolean(value),
      };
    } else if (field === 'appliesToSections') {
      updatedAddOns[index] = {
        ...currentAddOn,
        appliesToSections: Array.isArray(value) ? value : [],
      };
    } else if (field === 'id') {
      updatedAddOns[index] = {
        ...currentAddOn,
        id: typeof value === 'string' ? value : String(value || ''),
      };
    } else {
      updatedAddOns[index] = {
        ...currentAddOn,
        [field]: value,
      };
    }
    
    setFormData({ ...formData, addOns: updatedAddOns });
  };

  const toggleAddOnSection = (addOnIndex: number, sectionId: string) => {
    const updatedAddOns = [...formData.addOns];
    const currentAddOn = updatedAddOns[addOnIndex];
    const currentSections = currentAddOn.appliesToSections || [];
    
    if (currentSections.includes(sectionId)) {
      updatedAddOns[addOnIndex] = {
        ...currentAddOn,
        appliesToSections: currentSections.filter(id => id !== sectionId),
      };
    } else {
      updatedAddOns[addOnIndex] = {
        ...currentAddOn,
        appliesToSections: [...currentSections, sectionId],
      };
    }
    
    setFormData({ ...formData, addOns: updatedAddOns });
  };

  // Helper function to format time from 24-hour to 12-hour format
  const formatTimeForDisplay = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.name.trim()) {
        setError('Event name is required');
        setLoading(false);
        return;
      }

      if (!formData.venue.trim()) {
        setError('Venue is required');
        setLoading(false);
        return;
      }

      if (!formData.startDate) {
        setError('Start date is required');
        setLoading(false);
        return;
      }

      if (!formData.endDate) {
        setError('End date is required');
        setLoading(false);
        return;
      }

      if (!formData.startTime) {
        setError('Start time is required');
        setLoading(false);
        return;
      }

      if (!formData.endTime) {
        setError('End time is required');
        setLoading(false);
        return;
      }

      const startDateObj = new Date(formData.startDate);
      const endDateObj = new Date(formData.endDate);
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        setError('Invalid date format');
        setLoading(false);
        return;
      }

      if (startDateObj > endDateObj) {
        setError('Start date must be before or equal to end date');
        setLoading(false);
        return;
      }

      // Validate that end time is after start time if same date
      if (formData.startDate === formData.endDate) {
        const [startHour, startMin] = formData.startTime.split(':').map(Number);
        const [endHour, endMin] = formData.endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        if (endMinutes <= startMinutes) {
          setError('End time must be after start time');
          setLoading(false);
          return;
        }
      }

      // Validate check-in time is before start time (if check-in time is provided)
      if (formData.checkInTime && formData.startTime) {
        const [checkInHour, checkInMin] = formData.checkInTime.split(':').map(Number);
        const [startHour, startMin] = formData.startTime.split(':').map(Number);
        const checkInMinutes = checkInHour * 60 + checkInMin;
        const startMinutes = startHour * 60 + startMin;
        
        // If same date, check-in must be before start time
        if (formData.startDate === formData.endDate && checkInMinutes >= startMinutes) {
          setError('Check-in time must be before the tournament start time');
          setLoading(false);
          return;
        }
      }

      // Tournament-specific validation
      if (formData.type === 'tournament') {
        if (!formData.timeControlCategory) {
          setError('Time control category is required for tournaments');
          setLoading(false);
          return;
        }
        if (!formData.timeControlFormat.trim()) {
          setError('Time setting is required for tournaments');
          setLoading(false);
          return;
        }

        // Validate sections
        if (formData.sections.length > 0) {
          for (const section of formData.sections) {
            if (!section.name.trim()) {
              setError('All tournament sections must have a name');
              setLoading(false);
              return;
            }
          }
        }
      }

      // Validate add-ons
      for (const addOn of formData.addOns) {
        if (!addOn.name.trim()) {
          setError('All add-ons must have a name');
          setLoading(false);
          return;
        }
      }

      // Determine franchiseId based on user selection
      let franchiseId: string | null | undefined = null;
      const userRole = role ?? 'player';
      
      if (eventLinkType === 'franchise') {
        // User selected "Linked to Franchise"
        if (selectedFranchiseId) {
          // Use selected franchise from dropdown
          franchiseId = selectedFranchiseId;
        } else if (franchiseIdInput.trim()) {
          // Use manually entered franchise ID
          franchiseId = franchiseIdInput.trim();
        } else if (userRole === 'franchisee') {
          // Franchisee defaulting to their own ID
          franchiseId = user.uid;
        } else {
          setError('Please select or enter a franchise name when linking to a franchise.');
          setLoading(false);
          return;
        }
      } else {
        // User selected "Standalone"
        franchiseId = null;
      }
      
      // Normalize structured location
      let structuredLocation = null;
      if (formData.venueType === 'In-person' && formData.locationAutocompleteResult) {
        try {
          structuredLocation = await normalizeLocation({
            locationType: 'in_person',
            venueName: formData.locationVenueName || undefined,
            addressLine1: formData.locationAddressLine1 || undefined,
            addressLine2: formData.locationAddressLine2 || undefined,
            city: formData.locationCity || undefined,
            admin1: formData.locationAdmin1 || undefined,
            postalCode: formData.locationPostalCode || undefined,
            countryCode: formData.locationCountryCode || undefined,
            autocompleteResult: formData.locationAutocompleteResult,
          });
        } catch (err) {
          console.warn('Failed to normalize location:', err);
          // Continue without structured location
        }
      } else if (formData.venueType === 'Online') {
        structuredLocation = await normalizeLocation({
          locationType: 'online',
          onlinePlatform: 'Custom',
          onlineAccessType: 'public',
          onlineUrl: formData.venue || undefined,
        });
      }

      // Helper function to remove undefined values from an object (Firestore doesn't accept undefined)
      const removeUndefined = (obj: any): any => {
        if (obj === null) return null;
        if (obj === undefined) return null; // Convert undefined to null
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined).filter(item => item !== undefined && item !== null || item === null);
        }
        if (typeof obj === 'object' && obj.constructor === Object) {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
              const cleanedValue = removeUndefined(value);
              if (cleanedValue !== undefined) {
                cleaned[key] = cleanedValue;
              }
            }
          }
          return cleaned;
        }
        return obj;
      };

      // Prepare event data for Firestore
      // Note: Status will be set by createEvent based on role and franchiseId
      const eventData: any = {
        title: formData.name, // Use name as title for backward compatibility
        name: formData.name,  // Also include name for new format
        description: formData.description.trim() || '',
        venue: formData.venue.trim(),
        location: formData.venue.trim(), // Also include location for backward compatibility
        startDate: Timestamp.fromDate(startDateObj),
        endDate: Timestamp.fromDate(endDateObj),
        date: formData.startDate.split('T')[0], // Legacy date field
        category: formData.type === 'tournament' ? 'tournament' : 'event', // Map to category
        type: formData.type, // New type field
        createdBy: user.uid,
        createdByEmail: user.email || '',
        createdByName: user.displayName || user.email?.split('@')[0] || 'Organizer',
        status: 'pendingApproval', // Will be overridden by createEvent based on role
        registeredUsers: [],
        savedByUsers: [],
        // Legacy price field - use first pricing tier if available, or empty
        price: formData.pricingTiers.length > 0 && formData.pricingTiers[0].price > 0
          ? `$${formData.pricingTiers[0].price.toFixed(2)}`
          : '',
      };

      // Add structuredLocation only if it exists and has data (remove undefined values)
      if (structuredLocation) {
        const cleanedLocation = removeUndefined(structuredLocation);
        // Only add if it has at least the type field
        if (cleanedLocation && cleanedLocation.type) {
          eventData.structuredLocation = cleanedLocation;
        }
      }

      // Time fields
      if (formData.startTime) {
        eventData.startTime = formData.startTime.trim();
      }
      if (formData.endTime) {
        eventData.endTime = formData.endTime.trim();
      }
      // Check-in time (optional)
      if (formData.checkInTime) {
        eventData.checkInTime = formData.checkInTime.trim();
      }
      // Format time string for legacy 'time' field (e.g., "10:00 AM - 5:00 PM")
      if (formData.startTime && formData.endTime) {
        eventData.time = `${formatTimeForDisplay(formData.startTime)} - ${formatTimeForDisplay(formData.endTime)}`;
      } else if (formData.startTime) {
        eventData.time = formatTimeForDisplay(formData.startTime);
      }

      // Time Control - build TimeControl object
      if (formData.type === 'tournament' && formData.timeControlCategory && formData.timeControlFormat) {
        const timeControl: TimeControl = {
          category: formData.timeControlCategory as "Classical" | "Rapid" | "Blitz" | "Other",
          format: formData.timeControlFormat.trim(),
        };
        // Only add customLabel if it has a value (Firestore doesn't allow undefined)
        const trimmedCustomLabel = formData.timeControlCustomLabel.trim();
        if (trimmedCustomLabel) {
          timeControl.customLabel = trimmedCustomLabel;
        }
        eventData.timeControl = timeControl;
        // Also keep legacy string for backward compatibility
        eventData.timeControlString = timeControl.customLabel || timeControl.format || timeControl.category;
      }

      // Rating Type
      if (formData.type === 'tournament' && formData.ratingType) {
        eventData.ratingType = formData.ratingType as 'FIDE' | 'USCF' | 'Club';
        // Legacy support: set fideRated if FIDE is selected
        if (formData.ratingType === 'FIDE') {
          eventData.fideRated = true;
        }
      }

      // Optional fields
      if (formData.image) {
        eventData.image = formData.image.trim();
        eventData.heroImageUrl = formData.image.trim(); // Map image to heroImageUrl for detail page
      }
      if (formData.contactEmail) {
        eventData.contactEmail = formData.contactEmail.trim();
      }
      if (formData.contactPhone) {
        eventData.contactPhone = formData.contactPhone.trim();
      }
      if (formData.venueType) {
        eventData.venueType = formData.venueType;
      }
      if (formData.ageLimit) {
        eventData.ageLimit = formData.ageLimit.trim();
      }
      if (formData.equipmentProvided) {
        eventData.equipmentProvided = formData.equipmentProvided.trim();
      }
      // Coordinates - if provided, convert to numbers
      if (formData.coordinates.lat && formData.coordinates.lng) {
        const lat = parseFloat(formData.coordinates.lat);
        const lng = parseFloat(formData.coordinates.lng);
        if (!isNaN(lat) && !isNaN(lng)) {
          eventData.coordinates = { lat, lng };
        }
      }

      // Pricing tiers
      if (formData.pricingTiers.length > 0) {
        eventData.pricingTiers = formData.pricingTiers
          .map(tier => {
            const tierObj: any = {
              id: tier.id,
              name: tier.name || '',
              price: tier.price || 0,
              description: tier.description || '',
              currency: tier.currency || 'USD',
            };
            // Only include countryCode if it has a value
            if (tier.countryCode && tier.countryCode.trim()) {
              tierObj.countryCode = tier.countryCode.trim();
            }
            return tierObj;
          })
          .map(removeUndefined); // Remove any undefined values
      }

      // Sections (for tournaments) - entryFee removed from UI but kept for backward compatibility
      if (formData.sections.length > 0) {
        eventData.sections = formData.sections.map(section => ({
          id: section.id,
          name: section.name || '',
          minRating: section.minRating ?? null,
          maxRating: section.maxRating ?? null,
          entryFee: null, // Always null since we removed it from UI
        }));
      }

      // Add-ons
      if (formData.addOns.length > 0) {
        eventData.addOns = formData.addOns.map(addOn => ({
          id: addOn.id,
          name: addOn.name || '',
          description: addOn.description || '',
          price: addOn.price ?? null,
          isRequired: addOn.isRequired || false,
          appliesToSections: addOn.appliesToSections || [],
        }));
      }

      if (mode === 'create') {
        // Pass role and franchiseId to createEvent
        // createEvent will handle status and franchiseId logic
        // Ensure we only pass valid roles (not 'player')
        let creatorRole: 'superAdmin' | 'franchisee' | 'standaloneAdmin' | undefined = undefined;
        if (userRole === 'superAdmin' || userRole === 'franchisee' || userRole === 'standaloneAdmin') {
          creatorRole = userRole;
        }
        // If role is not set, createEvent will fetch it from Firestore
        const eventId = await createEvent(eventData, creatorRole, franchiseId);
        if (onSaveSuccess) {
          onSaveSuccess(eventId);
        } else {
          router.push('/dashboard/admin');
        }
      } else if (mode === 'edit' && initialData?.id) {
        // Clean eventData before sending to updateEvent (remove undefined values)
        const cleanedEventData = removeUndefined(eventData);
        // Pass editorUid for permission check
        await updateEvent(initialData.id, cleanedEventData, user.uid);
        if (onSaveSuccess) {
          onSaveSuccess(initialData.id);
        } else {
          router.push('/dashboard/admin');
        }
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${mode} event`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Event Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Type *
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
        >
          <option value="tournament">Tournament</option>
          <option value="camp">Camp</option>
          <option value="class">Class</option>
          <option value="simul">Simul</option>
          <option value="clubNight">Club Night</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          placeholder="e.g., Spring Open Tournament"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          placeholder="Describe the event..."
        />
      </div>

      {/* Mode of Play */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mode of Play *
        </label>
        <select
          value={formData.venueType}
          onChange={(e) => setFormData({ ...formData, venueType: e.target.value as 'Online' | 'In-person' })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
        >
          <option value="In-person">In-person</option>
          <option value="Online">Online</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Select whether players will play in-person or online
        </p>
      </div>

      {/* Structured Location Fields */}
      {formData.venueType === 'Online' ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform/Details *
          </label>
          <input
            type="text"
            value={formData.venue}
            onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            placeholder="e.g., Chess.com, Lichess.org, Zoom link"
          />
        </div>
      ) : (
        <>
          {/* Location Autocomplete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Location *
            </label>
            <LocationAutocomplete
              value={formData.locationSearchQuery || ''}
              onInputChange={(query) => {
                // Track what user is typing
                setFormData({ ...formData, locationSearchQuery: query });
              }}
              onPlaceSelect={(place) => {
                // Extract address components
                const components = place.addressComponents || [];
                const getComponent = (type: string) => 
                  components.find(c => c.types.includes(type))?.longName || '';
                
                setFormData({
                  ...formData,
                  locationAutocompleteResult: place,
                  locationSearchQuery: place.formattedAddress, // Store the selected place
                  locationAddressLine1: getComponent('street_number') 
                    ? `${getComponent('street_number')} ${getComponent('route')}`.trim()
                    : getComponent('route') || place.formattedAddress.split(',')[0],
                  locationCity: getComponent('locality') || getComponent('administrative_area_level_2') || '',
                  locationAdmin1: getComponent('administrative_area_level_1') || '',
                  locationPostalCode: getComponent('postal_code') || '',
                  locationCountryCode: getComponent('country')?.toUpperCase() || '',
                  locationVenueName: formData.locationVenueName || place.formattedAddress.split(',')[0],
                  venue: place.formattedAddress, // Legacy field
                  coordinates: {
                    lat: place.coordinates.lat.toString(),
                    lng: place.coordinates.lng.toString()
                  }
                });
              }}
              placeholder="Search for venue or address..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Keep typing to see location suggestions...
            </p>
          </div>

          {/* Additional Location Fields (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name (Optional)
              </label>
              <input
                type="text"
                value={formData.locationVenueName}
                onChange={(e) => setFormData({ ...formData, locationVenueName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="e.g., ABC Chess Center"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                value={formData.locationAddressLine2}
                onChange={(e) => setFormData({ ...formData, locationAddressLine2: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="Suite, Floor, etc."
              />
            </div>
          </div>

          {/* Legacy venue field (hidden, auto-populated) */}
          <input type="hidden" value={formData.venue} />
        </>
      )}

      {/* Age Limit and Equipment (for tournaments) */}
      {formData.type === 'tournament' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age Limit (Optional)
            </label>
            <input
              type="text"
              value={formData.ageLimit}
              onChange={(e) => setFormData({ ...formData, ageLimit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="e.g., All ages, 18+, Under 16"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Provided (Optional)
            </label>
            <input
              type="text"
              value={formData.equipmentProvided}
              onChange={(e) => setFormData({ ...formData, equipmentProvided: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              placeholder="e.g., All chess sets provided"
            />
          </div>
        </div>
      )}

      {/* Event Linking (Franchise/Standalone) - Only show in create mode */}
      {mode === 'create' && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-slate-50 to-white">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Event Linking *
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Choose whether this event is linked to a franchise or standalone. 
              {role === 'franchisee' && ' Creating a standalone event requires Super Admin approval.'}
              {role === 'standaloneAdmin' && ' Creating a franchise event requires Super Admin approval.'}
            </p>
            <select
              value={eventLinkType}
              onChange={(e) => {
                const newType = e.target.value as 'franchise' | 'standalone';
                setEventLinkType(newType);
                // Reset franchise selection when switching
                if (newType === 'standalone') {
                  setSelectedFranchiseId('');
                  setFranchiseIdInput('');
                } else if (newType === 'franchise' && role === 'franchisee') {
                  // Auto-select franchisee's own ID
                  setSelectedFranchiseId(user?.uid || '');
                  setFranchiseIdInput(user?.uid || '');
                }
              }}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white font-medium"
            >
              <option value="standalone">Standalone Event</option>
              <option value="franchise">Linked to Franchise</option>
            </select>
          </div>

          {/* Franchise Selection - Only show if "Linked to Franchise" is selected */}
          {eventLinkType === 'franchise' && (
            <div className="space-y-3 bg-white rounded-lg p-4 border border-gray-200">
              {/* For franchisee: Just show info that it's linked to their franchise */}
              {role === 'franchisee' ? (
                <div className="text-sm text-gray-600">
                  <p>This event will be linked to your franchise automatically.</p>
                </div>
              ) : (
                <>
                  {/* For standalone admin and super admin: Show franchise selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Franchise
                    </label>
                    {loadingFranchisees ? (
                      <div className="text-sm text-gray-500">Loading franchises...</div>
                    ) : franchisees.length > 0 ? (
                      <select
                        value={selectedFranchiseId}
                        onChange={(e) => {
                          setSelectedFranchiseId(e.target.value);
                          // Clear manual input when selecting from dropdown
                          setFranchiseIdInput('');
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      >
                        <option value="">-- Select a franchise --</option>
                        {franchisees.map((franchisee) => {
                          const displayName = franchisee.firstName && franchisee.lastName
                            ? `${franchisee.firstName} ${franchisee.lastName} (${franchisee.email})`
                            : franchisee.email;
                          return (
                            <option key={franchisee.uid} value={franchisee.uid}>
                              {displayName}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-500">No franchises available. Enter franchise name manually below.</p>
                    )}
                  </div>
                  
                  {/* Only show "OR" divider and manual input if no franchise is selected from dropdown */}
                  {!selectedFranchiseId && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">OR</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter Franchise Name
                        </label>
                        <input
                          type="text"
                          value={franchiseIdInput}
                          onChange={(e) => {
                            setFranchiseIdInput(e.target.value);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                          placeholder="Enter franchise name or UID"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter the franchise name or UID to link this event to a franchise.
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Info message for approval requirements */}
          {((role === 'franchisee' && eventLinkType === 'standalone') || 
            (role === 'standaloneAdmin' && eventLinkType === 'franchise')) && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Approval Required</p>
                  <p className="mt-1">
                    This event will be submitted for Super Admin approval before it becomes visible on the site.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <div className="date-picker-wrapper-large">
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <div className="date-picker-wrapper-large">
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Time *
          </label>
          <div className="time-picker-wrapper-large">
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Time *
          </label>
          <div className="time-picker-wrapper-large">
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Check-in Time (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Check-in Time <span className="text-gray-500 font-normal">(Optional)</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Specify when contestants should check in before the tournament starts
        </p>
        <div className="time-picker-wrapper-large max-w-md">
          <input
            type="time"
            value={formData.checkInTime}
            onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
          />
        </div>
      </div>

      {/* Time Control (only for tournaments) */}
      {formData.type === 'tournament' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Control Category *
            </label>
            <select
              value={formData.timeControlCategory}
              onChange={(e) => setFormData({ 
                ...formData, 
                timeControlCategory: e.target.value as '' | 'Classical' | 'Rapid' | 'Blitz' | 'Other'
              })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            >
              <option value="">Select time control</option>
              <option value="Classical">Classical</option>
              <option value="Rapid">Rapid</option>
              <option value="Blitz">Blitz</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Setting *
            </label>
            <input
              type="text"
              value={formData.timeControlFormat}
              onChange={(e) => setFormData({ ...formData, timeControlFormat: e.target.value })}
              placeholder="e.g. 60+5, 25+5, 5+0, G/30; d5"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use any format you like. Examples: 60+5 (60 minutes + 5s increment), 60+0, 5+0 Blitz, or USCF style G/30; d5.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Time Control Label <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.timeControlCustomLabel}
              onChange={(e) => setFormData({ ...formData, timeControlCustomLabel: e.target.value })}
              placeholder="e.g. Friday Night Rapid, Club Time Control"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              If you want a special name, enter it here. Otherwise we'll show the time setting only.
            </p>
          </div>
        </div>
      )}

      {/* Rating Type (only for tournaments) */}
      {formData.type === 'tournament' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating Type <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <select
              value={formData.ratingType}
              onChange={(e) => setFormData({ 
                ...formData, 
                ratingType: e.target.value as '' | 'FIDE' | 'USCF' | 'Club'
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            >
              <option value="">No rating type</option>
              <option value="FIDE">FIDE Rated</option>
              <option value="USCF">USCF Rated</option>
              <option value="Club">Club Rated</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select the rating system used for this tournament. This will help players find tournaments that match their rating type.
            </p>
          </div>
        </div>
      )}

      {/* Pricing Tiers */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
            <p className="text-xs text-gray-500 mt-1">
              Add multiple pricing tiers (e.g., Early Bird, Standard, Late Registration)
            </p>
          </div>
          <button
            type="button"
            onClick={addPricingTier}
            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition"
          >
            + Add Pricing Tier
          </button>
        </div>

        {formData.pricingTiers.length === 0 && (
          <p className="text-sm text-gray-500 mb-3">
            No pricing tiers added. Add at least one pricing tier to set the event price.
          </p>
        )}

        {formData.pricingTiers.map((tier, index) => (
          <div key={tier.id || index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Pricing Tier {index + 1}</h4>
              <button
                type="button"
                onClick={() => removePricingTier(index)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tier Name *
                </label>
                <input
                  type="text"
                  value={tier.name || ''}
                  onChange={(e) => updatePricingTier(index, 'name', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                  placeholder="e.g., Early Bird, Standard, Late"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <div className="flex gap-2">
                  <select
                    value={tier.currency || 'USD'}
                    onChange={(e) => updatePricingTier(index, 'currency', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm bg-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="KRW">KRW (₩)</option>
                    <option value="BRL">BRL (R$)</option>
                    <option value="MXN">MXN ($)</option>
                    <option value="ARS">ARS ($)</option>
                    <option value="ZAR">ZAR (R)</option>
                    <option value="TRY">TRY (₺)</option>
                    <option value="RUB">RUB (₽)</option>
                    <option value="SGD">SGD (S$)</option>
                    <option value="HKD">HKD (HK$)</option>
                    <option value="NZD">NZD (NZ$)</option>
                    <option value="CHF">CHF (CHF)</option>
                    <option value="SEK">SEK (kr)</option>
                    <option value="NOK">NOK (kr)</option>
                    <option value="DKK">DKK (kr)</option>
                    <option value="PLN">PLN (zł)</option>
                    <option value="CZK">CZK (Kč)</option>
                    <option value="HUF">HUF (Ft)</option>
                    <option value="THB">THB (฿)</option>
                    <option value="MYR">MYR (RM)</option>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="PHP">PHP (₱)</option>
                    <option value="VND">VND (₫)</option>
                    <option value="PKR">PKR (₨)</option>
                    <option value="BDT">BDT (৳)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="SAR">SAR (﷼)</option>
                    <option value="EGP">EGP (E£)</option>
                    <option value="NGN">NGN (₦)</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tier.price || ''}
                    onChange={(e) => updatePricingTier(index, 'price', e.target.value ? parseFloat(e.target.value) : 0)}
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                    placeholder="e.g., 50.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Country (Optional)
                </label>
                <div className="flex gap-2">
                  <select
                    value={tier.countryCode || ''}
                    onChange={(e) => updatePricingTier(index, 'countryCode', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm bg-white"
                  >
                    <option value="">Global (All Countries)</option>
                    <option value="US">United States</option>
                    <option value="IN">India</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="BR">Brazil</option>
                    <option value="MX">Mexico</option>
                    <option value="JP">Japan</option>
                    <option value="CN">China</option>
                    <option value="RU">Russia</option>
                    <option value="KR">South Korea</option>
                    <option value="NL">Netherlands</option>
                    <option value="PL">Poland</option>
                    <option value="UA">Ukraine</option>
                    <option value="AR">Argentina</option>
                    <option value="CL">Chile</option>
                    <option value="CO">Colombia</option>
                    <option value="PE">Peru</option>
                    <option value="PH">Philippines</option>
                    <option value="ID">Indonesia</option>
                    <option value="VN">Vietnam</option>
                    <option value="TH">Thailand</option>
                    <option value="MY">Malaysia</option>
                    <option value="SG">Singapore</option>
                    <option value="BD">Bangladesh</option>
                    <option value="PK">Pakistan</option>
                    <option value="EG">Egypt</option>
                    <option value="ZA">South Africa</option>
                    <option value="NG">Nigeria</option>
                    <option value="TR">Turkey</option>
                    <option value="GR">Greece</option>
                    <option value="PT">Portugal</option>
                    <option value="IE">Ireland</option>
                    <option value="NZ">New Zealand</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="AE">United Arab Emirates</option>
                  </select>
                  <input
                    type="text"
                    value={tier.countryCode || ''}
                    onChange={(e) => updatePricingTier(index, 'countryCode', e.target.value.toUpperCase())}
                    placeholder="Or enter ISO code (e.g., IN, US, GB)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                    maxLength={2}
                    pattern="[A-Z]{2}"
                    title="Enter 2-letter ISO country code (e.g., IN, US, GB)"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for global pricing, select from dropdown, or enter any 2-letter ISO country code (e.g., IN, US, GB, FR, DE, etc.)
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={tier.description || ''}
                  onChange={(e) => updatePricingTier(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                  placeholder="e.g., Available until March 1st"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sections (only for tournaments) */}
      {formData.type === 'tournament' && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tournament Sections</h3>
            <button
              type="button"
              onClick={addSection}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition"
            >
              + Add Section
            </button>
          </div>

          {formData.sections.length === 0 && (
            <p className="text-sm text-gray-500 mb-3">
              No sections added. Sections allow you to organize tournaments by rating categories (e.g., Open, U1600, U1200).
            </p>
          )}

          {formData.sections.map((section, index) => (
            <div key={section.id || index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-white">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Section {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    value={section.name || ''}
                    onChange={(e) => updateSection(index, 'name', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                    placeholder="e.g., Open, U1600, U1200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Min Rating (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={section.minRating ?? ''}
                    onChange={(e) => updateSection(index, 'minRating', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                    placeholder="e.g., 1200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Max Rating (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={section.maxRating ?? ''}
                    onChange={(e) => updateSection(index, 'maxRating', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                    placeholder="e.g., 1600"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add-Ons (for all event types) */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add-Ons</h3>
          <button
            type="button"
            onClick={addAddOn}
            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition"
          >
            + Add Add-On
          </button>
        </div>

        {formData.addOns.length === 0 && (
          <p className="text-sm text-gray-500 mb-3">
            No add-ons added. Add-ons are optional paid extras for event registrations (e.g., T-shirt, lunch, coaching session).
          </p>
        )}

        {formData.addOns.map((addOn, index) => (
          <div key={addOn.id || index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Add-On {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeAddOn(index)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={addOn.name || ''}
                  onChange={(e) => updateAddOn(index, 'name', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                  placeholder="e.g., T-shirt, Lunch, Coaching Session"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={addOn.description || ''}
                  onChange={(e) => updateAddOn(index, 'description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                  placeholder="Brief description of the add-on"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={addOn.price ?? ''}
                    onChange={(e) => updateAddOn(index, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-sm"
                    placeholder="e.g., 25.00"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`required-${index}`}
                    checked={addOn.isRequired || false}
                    onChange={(e) => updateAddOn(index, 'isRequired', e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`required-${index}`} className="ml-2 block text-xs text-gray-700">
                    Required (always included in registration)
                  </label>
                </div>
              </div>

              {/* Section applicability (only for tournaments with sections) */}
              {formData.type === 'tournament' && formData.sections.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Applies to Sections (Optional - leave unchecked for all sections)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.sections.map((section) => (
                      <label key={section.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(addOn.appliesToSections || []).includes(section.id)}
                          onChange={() => toggleAddOnSection(index, section.id)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs text-gray-700">{section.name || `Section ${section.id}`}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email (Optional)
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            placeholder="contact@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Phone (Optional)
          </label>
          <input
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Flyer/Image (Optional)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Accepted formats: JPEG, PNG, WebP, GIF | Max 5MB upload size
        </p>
        
        {imagePreview && (
          <div className="mb-4 relative inline-block">
            <img src={imagePreview} alt="Preview" className="max-w-xs h-48 object-cover rounded-lg border-2 border-gray-200 shadow-sm" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg transition"
              title="Remove image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            disabled={uploadingImage}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`flex items-center justify-center gap-2 px-6 py-3 border-2 border-dashed rounded-lg cursor-pointer transition ${
              uploadingImage
                ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                : 'border-orange-300 bg-orange-50 hover:border-orange-400 hover:bg-orange-100'
            }`}
          >
            {uploadingImage ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                <span className="text-sm font-medium text-gray-600">Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-orange-700">
                  {imagePreview ? 'Change Image' : 'Upload Event Flyer'}
                </span>
              </>
            )}
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Update Event'}
        </button>
      </div>
    </form>
  );
}
