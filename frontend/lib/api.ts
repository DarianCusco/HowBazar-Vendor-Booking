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
  booth_slots?: BoothSlot[];
}

export interface BoothSlot {
  id: number;
  event: number;
  spot_number: string;
  is_available: boolean;
}

export interface MultiDateReservation {
  eventDate: string;
  reservationData: ReserveBoothSlotData;
}

export interface CalendarEvent {
  id: number;
  name: string;
  date: string;
  available_slots: number;
}

export interface ReserveBoothSlotData {
  vendor_type?: 'regular' | 'food';
  first_name: string;
  last_name: string;
  vendor_email: string;
  business_name?: string;
  phone: string;
  notes?: string;
}

export async function reserveMultiEventSpots(
  reservations: MultiDateReservation[]
): Promise<{ checkout_url: string; session_id: string }> {
  const response = await fetch(`${API_BASE_URL}/events/multi/reserve/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reservations }),
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

export async function getEvents(): Promise<Event[]> {
  const response = await fetch(`${API_BASE_URL}/events/`);
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  return response.json();
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const response = await fetch(`${API_BASE_URL}/events/calendar/`);
  if (!response.ok) {
    throw new Error('Failed to fetch calendar events');
  }
  return response.json();
}

export async function getEvent(id: number): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/events/${id}/`);
  if (!response.ok) {
    throw new Error('Failed to fetch event');
  }
  return response.json();
}

export async function getBoothSlot(id: number): Promise<BoothSlot> {
  const response = await fetch(`${API_BASE_URL}/booth-slots/${id}/`);
  if (!response.ok) {
    throw new Error('Failed to fetch booth slot');
  }
  return response.json();
}

export async function reserveBoothSlot(
  boothSlotId: number,
  data: ReserveBoothSlotData
): Promise<{ checkout_url: string; session_id: string }> {
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

export async function checkPaymentStatus(sessionId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/bookings/status/${sessionId}/`);
  
  if (!response.ok) {
    throw new Error('Failed to check payment status');
  }
  
  return response.json();
}

export async function reserveEventSpot(
  eventId: number,
  data: ReserveBoothSlotData
): Promise<{ checkout_url: string; session_id: string }> {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/reserve/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    // Try to parse as JSON, but handle HTML error pages
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
      // Server returned HTML (likely an error page)
      errorMessage = `Server error (${response.status}). Please check the backend logs.`;
    }
    
    throw new Error(errorMessage);
  }



  return response.json();
}

