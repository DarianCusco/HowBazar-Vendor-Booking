// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  regular_spots_total: number;
  regular_spots_available: number;
  food_spots_total: number;
  food_spots_available: number;
  regular_price: number;
  food_price: number;
  has_regular_spots: boolean;
  has_food_spots: boolean;
  total_spots_available: number;
  booth_slots?: BoothSlot[];
}

export interface BoothSlot {
  id: number;
  event: number;
  spot_number: string;
  slot_type: 'regular' | 'food';
  is_available: boolean;
}

export interface CalendarEvent {
  id: number;
  name: string;
  date: string;
  // Make new fields optional for backward compatibility
  regular_spots_available?: number;
  food_spots_available?: number;
  regular_spots_total?: number;
  food_spots_total?: number;
  // Keep old fields for fallback
  available_slots_count?: number;
  available_food_truck_spots?: number;
  status?: 'available' | 'tentative' | 'big_festival';
}

export interface MultiDateReservation {
  eventDate: string;
  reservationData: ReserveBoothSlotData;
}

export interface ReserveBoothSlotData {
  vendor_type: 'regular' | 'food';
  first_name: string;
  last_name: string;
  vendor_email: string;
  business_name?: string;
  phone: string;
  
  // Personal information (optional)
  preferred_name?: string;
  pronouns?: string;
  instagram?: string;
  
  // Consents
  social_media_consent?: 'yes' | 'no';
  photo_consent?: 'yes' | 'no';
  noise_sensitive?: 'yes' | 'no' | 'no-preference';
  
  // Booth sharing
  sharing_booth?: 'yes' | 'no';
  booth_partner_instagram?: string;
  
  // Additional
  price_range?: string;
  additional_notes?: string;
  
  // Regular vendor specific
  products_selling?: string;
  electricity_cord?: 'yes' | 'no';
  
  // Food truck specific
  cuisine_type?: string;
  food_items?: string;
  setup_size?: string;
  generator?: 'yes' | 'no' | 'battery';
  health_permit?: string;
  
  // Multi-date support
  multi_date_group_id?: string;
  
  // Legacy notes field (for backward compatibility)
  notes?: string;
}

export interface ReservationResponse {
  checkout_url: string;
  session_id: string;
  booking_id?: number;
  booking_ids?: number[];
  total_price?: number;
  num_dates?: number;
  message?: string;
}

export interface BookingStatusResponse {
  status: 'success';
  payment_status: 'pending' | 'authorized' | 'approved' | 'cancelled' | 'expired';
  is_paid: boolean;
  num_dates: number;
  total_price: number;
  first_name: string;
  last_name: string;
  business_name: string;
  selected_dates: string[];
  bookings: any[];
}

export interface AvailabilityResponse {
  date: string;
  regular: {
    available: number;
    total: number;
    price: number;
  };
  food: {
    available: number;
    total: number;
    price: number;
  };
}

// Get all events
export async function getEvents(): Promise<Event[]> {
  const response = await fetch(`${API_BASE_URL}/events/`);
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  return response.json();
}

// Get calendar events with availability
export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const response = await fetch(`${API_BASE_URL}/events/calendar/`);
  if (!response.ok) {
    throw new Error('Failed to fetch calendar events');
  }
  return response.json();
}

// Get single event by ID
export async function getEvent(id: number): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/events/${id}/`);
  if (!response.ok) {
    throw new Error('Failed to fetch event');
  }
  return response.json();
}

// Get availability for a specific date
export async function getEventAvailability(date: string): Promise<AvailabilityResponse> {
  const response = await fetch(`${API_BASE_URL}/events/availability/${date}/`);
  if (!response.ok) {
    throw new Error('Failed to fetch availability');
  }
  return response.json();
}

// Get booth slot by ID
export async function getBoothSlot(id: number): Promise<BoothSlot> {
  const response = await fetch(`${API_BASE_URL}/booth-slots/${id}/`);
  if (!response.ok) {
    throw new Error('Failed to fetch booth slot');
  }
  return response.json();
}

// Reserve a single event spot
export async function reserveEventSpot(
  eventId: number,
  data: ReserveBoothSlotData
): Promise<ReservationResponse> {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/reserve/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to reserve spot';
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const error = await response.json();
        errorMessage = error.error || error.detail || JSON.stringify(error);
      } catch (e) {
        errorMessage = `Server error (${response.status})`;
      }
    } else {
      errorMessage = `Server error (${response.status}). Please check the backend logs.`;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

// Reserve multiple event spots (for multi-date booking)
export async function reserveMultiEventSpots(
  reservations: MultiDateReservation[]
): Promise<ReservationResponse> {
  const response = await fetch(`${API_BASE_URL}/events/multi/reserve/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      reservations,
      booking_type: 'multi_date',
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to reserve spots';
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const error = await response.json();
        errorMessage = error.error || error.detail || JSON.stringify(error);
      } catch (e) {
        errorMessage = `Server error (${response.status})`;
      }
    } else {
      errorMessage = `Server error (${response.status}). Please check the backend logs.`;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

// Check booking status by session ID
export async function checkBookingStatus(sessionId: string): Promise<BookingStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/bookings/status/${sessionId}/`);
  
  if (!response.ok) {
    throw new Error('Failed to check booking status');
  }
  
  return response.json();
}