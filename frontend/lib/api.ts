// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  price: string;
  number_of_spots: number;
  available_slots_count: number;
  food_truck_spots?: number; // Add food truck specific spots
  available_food_truck_spots?: number;
  booth_slots?: BoothSlot[];
}

export interface BoothSlot {
  id: number;
  event: number;
  spot_number: string;
  is_available: boolean;
  slot_type: 'regular' | 'food'; // Add slot type
}

export interface CalendarEvent {
  id: number;
  name: string;
  date: string;
  number_of_spots: number;
  available_slots_count: number;
  food_truck_spots?: number; // Add food truck spots
  available_food_truck_spots?: number;
  status?: 'available' | 'tentative' | 'big_festival'; // Add status from your market data
}

export interface MultiDateReservation {
  eventDate: string;
  reservationData: ReserveBoothSlotData;
}

export interface ReserveBoothSlotData {
  vendor_type: 'regular' | 'food'; // Make this required
  first_name: string;
  last_name: string;
  vendor_email: string;
  business_name: string; // Make required
  phone: string;
  
  // Personal information (optional)
  preferred_name?: string;
  pronouns?: string;
  instagram?: string;
  
  // Consents (optional but recommended)
  social_media_consent?: 'yes' | 'no';
  photo_consent?: 'yes' | 'no';
  noise_sensitive?: 'yes' | 'no' | 'no-preference';
  
  // Booth sharing (optional)
  sharing_booth?: 'yes' | 'no';
  booth_partner_instagram?: string;
  
  // Additional (optional)
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
  health_permit?: string; // Add health permit field
  
  // Selected dates for multi-booking (optional)
  selected_dates?: string[];
  
  // Legacy notes field (for backward compatibility)
  notes?: string;
}

export interface ReservationResponse {
  checkout_url: string;
  session_id: string;
  message?: string;
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
      // Add metadata about the booking
      booking_type: 'multi_date',
      total_dates: reservations.length
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

// Reserve a specific booth slot
export async function reserveBoothSlot(
  boothSlotId: number,
  data: ReserveBoothSlotData
): Promise<ReservationResponse> {
  const response = await fetch(`${API_BASE_URL}/booth-slots/${boothSlotId}/reserve/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reserve booth slot');
  }

  return response.json();
}

// Check payment status
export async function checkPaymentStatus(sessionId: string): Promise<{
  status: 'pending' | 'completed' | 'failed';
  booking_id?: number;
  message?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/bookings/status/${sessionId}/`);
  
  if (!response.ok) {
    throw new Error('Failed to check payment status');
  }
  
  return response.json();
}

// Get availability for a specific date range
export async function getAvailability(
  startDate: string,
  endDate: string
): Promise<{
  dates: {
    date: string;
    regular_spots_available: number;
    food_spots_available: number;
    status: string;
  }[];
}> {
  const response = await fetch(
    `${API_BASE_URL}/events/availability/?start_date=${startDate}&end_date=${endDate}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch availability');
  }
  
  return response.json();
}