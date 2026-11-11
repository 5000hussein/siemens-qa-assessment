export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  events: '/events',
  eventDetails: (eventId: number) => `/events/${eventId}`,
  myBookings: '/bookings',
  bookingDetails: (bookingId: number) => `/bookings/${bookingId}`,
};
