export type EventItem = {
  id: number;
  title: string;
  category: string;
  venue: string;
  city: string;
  eventDate: string;
  // Documented as number, returned as string ("2500")
  price: number | string;
  totalSeats: number;
  availableSeats: number;
};

export type Booking = {
  id: number;
  eventId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  // Documented as number, returned as string ("900")
  totalPrice: number | string;
  status: 'confirmed' | 'cancelled';
  bookingRef: string;
  event?: EventItem;
};

export type CreateBookingInput = {
  eventId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
};

export type Customer = Omit<CreateBookingInput, 'eventId' | 'quantity'>;
