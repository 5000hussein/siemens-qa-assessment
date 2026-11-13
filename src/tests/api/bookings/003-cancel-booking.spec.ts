import { test, expect } from '../../../core/fixtures';
import { readJsonObject, readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { buildBookingInput } from '../../../data/builders/bookingBuilder';
import { successMessages } from '../../../data/assertions.json';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const apiData = readJsonObject(bookingsDataPath, `${currentEnv}.api`);

test.describe('AC4 via API: DELETE /api/bookings/{id}', () => {
  test('cancels the booking, removes it and restores the seats', async ({ eventsApi, bookingsApi }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    const booking = await bookingsApi.createBooking(buildBookingInput(event.id, apiData.quantity));

    const response = await bookingsApi.cancel(booking.id);

    expect(response.status()).toBe(200);
    expect((await response.json()).message).toBe(successMessages.booking.apiCancelled);
    expect((await bookingsApi.get(booking.id)).status()).toBe(404);
    expect((await bookingsApi.getByRef(booking.bookingRef)).status()).toBe(404);
    expect((await eventsApi.getEvent(event.id)).availableSeats).toBe(event.availableSeats);
  });

  test('cancelling the same booking twice returns 404 the second time', async ({ eventsApi, bookingsApi }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    const booking = await bookingsApi.createBooking(buildBookingInput(event.id, apiData.quantity));

    expect((await bookingsApi.cancel(booking.id)).status()).toBe(200);
    expect((await bookingsApi.cancel(booking.id)).status()).toBe(404);
  });

  test('unknown booking id returns 404', async ({ bookingsApi }) => {
    expect((await bookingsApi.cancel(apiData.notFoundBookingId)).status()).toBe(404);
  });

  test('request without a token returns 401 and the booking survives', async ({ anonymousBookingsApi, eventsApi, bookingsApi }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    const booking = await bookingsApi.createBooking(buildBookingInput(event.id, apiData.quantity));

    expect((await anonymousBookingsApi.cancel(booking.id)).status()).toBe(401);
    expect((await bookingsApi.get(booking.id)).status()).toBe(200);
  });
});
