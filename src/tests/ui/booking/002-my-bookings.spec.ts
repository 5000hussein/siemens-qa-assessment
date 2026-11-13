import { test, expect } from '../../../core/fixtures';
import { readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { bookingStatuses } from '../../../data/assertions.json';
import type { EventItem } from '../../../api/types';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const customerName = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerName`);
const customerEmail = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerEmail`);
const customerPhone = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerPhone`);
const quantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.booking.quantity`));

let event: EventItem;

test.describe('US-114 My Bookings (UI)', () => {
  test.beforeEach(async ({ eventsApi }) => {
    const eventsResponse = await eventsApi.getEvents({ limit: 100 });
    expect(eventsResponse.status()).toBe(200);
    event = (await eventsResponse.json()).data.find((e: EventItem) => e.availableSeats >= minSeats);
  });

  test('AC3: a booking made in the UI appears in My Bookings', async ({ bookingsApi, eventDetailsPage, myBookingsPage }) => {
    await eventDetailsPage.navigate(event.id);
    await eventDetailsPage.bookTickets(quantity, customerName, customerEmail, customerPhone);
    const bookingRef = await eventDetailsPage.getBookingReference();

    await eventDetailsPage.clickViewMyBookings();
    await myBookingsPage.verifyBookingListed(bookingRef, event.title, quantity, event.price, bookingStatuses.confirmed);

    // Clean up
    const bookingResponse = await bookingsApi.getBookingByRef(bookingRef);
    expect(bookingResponse.status()).toBe(200);
    expect((await bookingsApi.cancelBooking((await bookingResponse.json()).data.id)).status()).toBe(200);
  });

  test('AC4: a booking can be cancelled from My Bookings and its seats are released', async ({
    eventsApi,
    bookingsApi,
    myBookingsPage,
  }) => {
    // Setup through the API: this test is about cancelling, not creating
    const createResponse = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;

    await myBookingsPage.navigate();
    await myBookingsPage.verifyBookingListed(booking.bookingRef, event.title, quantity, event.price, bookingStatuses.confirmed);
    await myBookingsPage.cancelBooking(booking.bookingRef);
    await myBookingsPage.verifyBookingNotListed(booking.bookingRef);

    // Survives a reload, and the backend agrees
    await myBookingsPage.navigate();
    await myBookingsPage.verifyBookingNotListed(booking.bookingRef);
    expect((await bookingsApi.getBooking(booking.id)).status()).toBe(404);
    const eventResponse = await eventsApi.getEvent(event.id);
    expect((await eventResponse.json()).data.availableSeats).toBe(event.availableSeats);
  });

  test('View Details shows the booking reference and status, event details, customer details and a payment summary where Total Paid = price per ticket × tickets', async ({
    bookingsApi,
    myBookingsPage,
    bookingDetailsPage,
  }) => {
    const createResponse = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;

    await myBookingsPage.navigate();
    await myBookingsPage.verifyBookingListed(booking.bookingRef, event.title, quantity, event.price, bookingStatuses.confirmed);
    await myBookingsPage.openBookingDetails(booking.bookingRef, booking.id);

    await bookingDetailsPage.verifyBookingHeader(booking.bookingRef, bookingStatuses.confirmed);
    await bookingDetailsPage.verifyEventDetails(event);
    await bookingDetailsPage.verifyCustomerDetails(customerName, customerEmail, customerPhone);
    await bookingDetailsPage.verifyPaymentSummary(quantity, event.price);

    // Clean up
    expect((await bookingsApi.cancelBooking(booking.id)).status()).toBe(200);
  });
});
