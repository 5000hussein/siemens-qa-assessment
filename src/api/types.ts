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
