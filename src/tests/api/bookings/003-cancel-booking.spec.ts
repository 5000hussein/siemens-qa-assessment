import { test, expect } from '../../../core/fixtures';
import { readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { successMessages } from '../../../data/assertions.json';
import type { EventItem } from '../../../api/types';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const customerName = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerName`);
const customerEmail = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerEmail`);
const customerPhone = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerPhone`);
const quantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.booking.quantity`));
const notFoundBookingId = Number(readJsonValue(bookingsDataPath, `${currentEnv}.notFound.bookingId`));

let event: EventItem;

test.describe('AC4 via API: DELETE /api/bookings/{id}', () => {
  test.beforeEach(async ({ eventsApi }) => {
    const eventsResponse = await eventsApi.getEvents({ limit: 100 });
    expect(eventsResponse.status()).toBe(200);
    event = (await eventsResponse.json()).data.find((e: EventItem) => e.availableSeats >= minSeats);
  });

  test('cancels the booking, removes it and restores the seats', async ({ eventsApi, bookingsApi }) => {
    const createResponse = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;

    const cancelResponse = await bookingsApi.cancelBooking(booking.id);

    expect(cancelResponse.status()).toBe(200);
    expect((await cancelResponse.json()).message).toBe(successMessages.booking.apiCancelled);
    expect((await bookingsApi.getBooking(booking.id)).status()).toBe(404);
    expect((await bookingsApi.getBookingByRef(booking.bookingRef)).status()).toBe(404);
    const eventResponse = await eventsApi.getEvent(event.id);
    expect((await eventResponse.json()).data.availableSeats).toBe(event.availableSeats);
  });

  test('cancelling the same booking twice returns 404 the second time', async ({ bookingsApi }) => {
    const createResponse = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;

    expect((await bookingsApi.cancelBooking(booking.id)).status()).toBe(200);
    expect((await bookingsApi.cancelBooking(booking.id)).status()).toBe(404);
  });

  test('unknown booking id returns 404', async ({ bookingsApi }) => {
    expect((await bookingsApi.cancelBooking(notFoundBookingId)).status()).toBe(404);
  });

  test('request without a token returns 401 and the booking survives', async ({ anonymousBookingsApi, bookingsApi }) => {
    const createResponse = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;

    expect((await anonymousBookingsApi.cancelBooking(booking.id)).status()).toBe(401);
    expect((await bookingsApi.getBooking(booking.id)).status()).toBe(200);

    expect((await bookingsApi.cancelBooking(booking.id)).status()).toBe(200);
  });
});
