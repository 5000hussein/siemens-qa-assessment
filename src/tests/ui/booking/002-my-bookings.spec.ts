import { test, expect } from '../../../core/fixtures';
import { readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { bookingStatuses } from '../../../data/assertions.json';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const customerName = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerName`);
const customerEmail = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerEmail`);
const customerPhone = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerPhone`);
const quantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.booking.quantity`));

test.describe('US-114 My Bookings (UI)', () => {
  test('AC3: a booking made in the UI appears in My Bookings', async ({ eventsApi, bookingsApi, eventDetailsPage, myBookingsPage }) => {
    const event = await eventsApi.findBookableEvent(minSeats);

    await eventDetailsPage.navigate(event.id);
    await eventDetailsPage.bookTickets(quantity, customerName, customerEmail, customerPhone);
    const bookingRef = await eventDetailsPage.getBookingReference();
    await bookingsApi.trackByRef(bookingRef);

    await eventDetailsPage.clickViewMyBookings();
    await myBookingsPage.verifyBookingListed(bookingRef, event.title, quantity, event.price, bookingStatuses.confirmed);
  });

  test('AC4: a booking can be cancelled from My Bookings and its seats are released', async ({
    eventsApi,
    bookingsApi,
    myBookingsPage,
  }) => {
    // Setup through the API: this test is about cancelling, not creating
    const event = await eventsApi.findBookableEvent(minSeats);
    const booking = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });

    await myBookingsPage.navigate();
    await myBookingsPage.verifyBookingListed(booking.bookingRef, event.title, quantity, event.price, bookingStatuses.confirmed);
    await myBookingsPage.cancelBooking(booking.bookingRef);
    await myBookingsPage.verifyBookingNotListed(booking.bookingRef);

    // Survives a reload, and the backend agrees
    await myBookingsPage.navigate();
    await myBookingsPage.verifyBookingNotListed(booking.bookingRef);
    expect((await bookingsApi.get(booking.id)).status()).toBe(404);
    expect((await eventsApi.getEvent(event.id)).availableSeats).toBe(event.availableSeats);
  });

  test('View Details shows the booking reference and status, event details, customer details and a payment summary where Total Paid = price per ticket × tickets', async ({
    eventsApi,
    bookingsApi,
    myBookingsPage,
    bookingDetailsPage,
  }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    const booking = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });

    await myBookingsPage.navigate();
    await myBookingsPage.verifyBookingListed(booking.bookingRef, event.title, quantity, event.price, bookingStatuses.confirmed);
    await myBookingsPage.openBookingDetails(booking.bookingRef, booking.id);

    await bookingDetailsPage.verifyBookingHeader(booking.bookingRef, bookingStatuses.confirmed);
    await bookingDetailsPage.verifyEventDetails(event);
    await bookingDetailsPage.verifyCustomerDetails(customerName, customerEmail, customerPhone);
    await bookingDetailsPage.verifyPaymentSummary(quantity, event.price);
  });
});
