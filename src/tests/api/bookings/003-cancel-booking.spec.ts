import { test, expect } from '../../../core/fixtures';
import { readJsonValue, readJsonObject } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { successMessages } from '../../../data/assertions.json';

const eventName = readJsonValue(bookingsDataPath, `${currentEnv}.eventName`);
const createBookingBody = readJsonObject(bookingsDataPath, `${currentEnv}.createBooking`);
const notFoundBookingId = Number(readJsonValue(bookingsDataPath, `${currentEnv}.notFound.bookingId`));

test.describe('AC4: DELETE /api/bookings/{id} cancels a booking', () => {
  test('Check the user is able to cancel a booking, the booking is removed and the seats are restored', async ({
    eventsApi,
    bookingsApi,
  }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];

    // Create the booking
    const createResponse = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;

    // Cancel the booking
    const cancelResponse = await bookingsApi.cancelBooking(booking.id);
    expect(cancelResponse.status()).toBe(200);
    expect((await cancelResponse.json()).message).toBe(successMessages.booking.apiCancelled);

    // The booking is gone and the seats are back
    expect((await bookingsApi.getBooking(booking.id)).status()).toBe(404);
    expect((await bookingsApi.getBookingByRef(booking.bookingRef)).status()).toBe(404);
    const eventResponse = await eventsApi.getEvent(event.id);
    expect((await eventResponse.json()).data.availableSeats).toBe(event.availableSeats);
  });

  test('Check the user is not able to cancel the same booking twice (404)', async ({ eventsApi, bookingsApi }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];

    // Create the booking
    const createResponse = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;

    // Cancel it twice: the second call finds nothing
    expect((await bookingsApi.cancelBooking(booking.id)).status()).toBe(200);
    expect((await bookingsApi.cancelBooking(booking.id)).status()).toBe(404);
  });

  test('Check the user is not able to cancel a booking that does not exist (404)', async ({ bookingsApi }) => {
    const response = await bookingsApi.cancelBooking(notFoundBookingId);
    expect(response.status()).toBe(404);
  });

  test('Check the user is not able to cancel a booking without a token (401) and the booking stays', async ({
    eventsApi,
    bookingsApi,
    anonymousBookingsApi,
  }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];

    // Create the booking
    const createResponse = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;

    // Cancel without a token: rejected, and the booking is still there
    expect((await anonymousBookingsApi.cancelBooking(booking.id)).status()).toBe(401);
    expect((await bookingsApi.getBooking(booking.id)).status()).toBe(200);

    // Cancel the booking
    const cancelResponse = await bookingsApi.cancelBooking(booking.id);
    expect(cancelResponse.status()).toBe(200);
  });
});
