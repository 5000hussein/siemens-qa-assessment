export const ROUTES = {
  login: '/login',
  events: '/events',
  eventDetails: (eventId: number) => `/events/${eventId}`,
  myBookings: '/bookings',
  bookingDetails: (bookingId: number) => `/bookings/${bookingId}`,
};
