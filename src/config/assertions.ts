export const successMessages = {
  booking: {
    confirmedHeading: 'Booking Confirmed!',
    ticketsReserved: 'Your tickets are reserved.',
    apiConfirmed: 'Booking confirmed!',
    apiCancelled: 'Booking cancelled',
  },
};

export const dialogs = {
  cancelBooking: {
    title: 'Cancel this booking?',
    confirmButton: 'Yes, cancel it',
  },
};

export const validationMessages = {
  booking: {
    name: 'Name must be at least 2 chars',
    email: 'Enter a valid email',
    phone: 'Enter a valid 10-digit phone',
  },
  api: {
    validationFailed: 'Validation failed',
    quantityRange: 'Quantity must be an integer between 1 and 10',
    unauthorized: 'Unauthorized',
  },
};

export const bookingStatuses = {
  confirmed: 'confirmed',
  cancelled: 'cancelled',
};

// Observed format is <first letter of event title>-<6 alphanumerics>; the API docs say EVT-XXXXXX (see README story review)
export const bookingRefPattern = /^[A-Z0-9]+-[A-Z0-9]{6}$/;
