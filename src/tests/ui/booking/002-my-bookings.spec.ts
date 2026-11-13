import { test, expect } from '../../../core/fixtures';
import { readJsonValue, readJsonObject } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { bookingStatuses } from '../../../data/assertions.json';

const eventName = readJsonValue(bookingsDataPath, `${currentEnv}.eventName`);
const createBookingBody = readJsonObject(bookingsDataPath, `${currentEnv}.createBooking`);

test.describe('US-114 My Bookings (UI)', () => {
  test('AC3: Check the user is able to see a booking made in the UI in My Bookings', async ({
    eventsApi,
    bookingsApi,
    bookingCleanup,
    eventDetailsPage,
    myBookingsPage,
  }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];

    // Book tickets in the UI
    await eventDetailsPage.navigate(event.id);
    await eventDetailsPage.bookTickets(
      createBookingBody.quantity,
      createBookingBody.customerName,
      createBookingBody.customerEmail,
      createBookingBody.customerPhone
    );
    const bookingRef = await eventDetailsPage.getBookingReference();

    // Look the booking up by its reference so the teardown cancels it even if a check below fails
    const bookingResponse = await bookingsApi.getBookingByRef(bookingRef);
    expect(bookingResponse.status()).toBe(200);
    bookingCleanup.track((await bookingResponse.json()).data.id);

    // The booking is listed in My Bookings
    await eventDetailsPage.clickViewMyBookings();
    await myBookingsPage.verifyBookingListed(bookingRef, eventName, createBookingBody.quantity, event.price, bookingStatuses.confirmed);
  });

  test('AC4: Check the user is able to cancel a booking from My Bookings and its seats are released', async ({
    eventsApi,
    bookingsApi,
    bookingCleanup,
    myBookingsPage,
  }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];

    // Create the booking through the API: this test is about cancelling, not creating
    const createResponse = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;
    bookingCleanup.track(booking.id);

    // Cancel it from My Bookings
    await myBookingsPage.navigate();
    await myBookingsPage.verifyBookingListed(
      booking.bookingRef,
      eventName,
      createBookingBody.quantity,
      event.price,
      bookingStatuses.confirmed
    );
    await myBookingsPage.cancelBooking(booking.bookingRef);
    await myBookingsPage.verifyBookingNotListed(booking.bookingRef);

    // Still gone after a reload, and the backend agrees
    await myBookingsPage.navigate();
    await myBookingsPage.verifyBookingNotListed(booking.bookingRef);
    expect((await bookingsApi.getBooking(booking.id)).status()).toBe(404);
    const eventResponse = await eventsApi.getEvent(event.id);
    expect((await eventResponse.json()).data.availableSeats).toBe(event.availableSeats);
  });

  test('AC3: Check the user is able to view the booking details: reference, status, event, customer and payment summary', async ({
    eventsApi,
    bookingsApi,
    bookingCleanup,
    myBookingsPage,
    bookingDetailsPage,
  }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];

    // Create the booking through the API
    const createResponse = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;
    bookingCleanup.track(booking.id);

    // Open its details from My Bookings
    await myBookingsPage.navigate();
    await myBookingsPage.verifyBookingListed(
      booking.bookingRef,
      eventName,
      createBookingBody.quantity,
      event.price,
      bookingStatuses.confirmed
    );
    await myBookingsPage.openBookingDetails(booking.bookingRef, booking.id);

    // Verify every section of the details page
    await bookingDetailsPage.verifyBookingHeader(booking.bookingRef, bookingStatuses.confirmed);
    await bookingDetailsPage.verifyEventDetails(eventName, event.category, event.venue, event.city);
    await bookingDetailsPage.verifyCustomerDetails(
      createBookingBody.customerName,
      createBookingBody.customerEmail,
      createBookingBody.customerPhone
    );
    await bookingDetailsPage.verifyPaymentSummary(createBookingBody.quantity, event.price);
  });
});
