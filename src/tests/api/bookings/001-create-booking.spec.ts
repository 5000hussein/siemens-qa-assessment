import { test, expect } from '../../../core/fixtures';
import { readJsonObject, readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { buildBookingInput } from '../../../data/builders/bookingBuilder';
import { patterns, bookingStatuses, successMessages } from '../../../data/assertions.json';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const customer = readJsonObject(bookingsDataPath, `${currentEnv}.customer`);
const quantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.api.quantity`));
const maxQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.api.maxQuantity`));

test.describe('AC5: POST /api/bookings creates a booking', () => {
  test('201 with booking reference, customer details and total = price × quantity', async ({ eventsApi, bookingsApi }) => {
    const event = await eventsApi.findBookableEvent(minSeats);

    const response = await bookingsApi.create(buildBookingInput(event.id, quantity));

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe(successMessages.booking.apiConfirmed);
    expect(body.data).toMatchObject({
      eventId: event.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      quantity,
      status: bookingStatuses.confirmed,
    });
    expect(body.data.bookingRef).toMatch(new RegExp(patterns.bookingRef));
    expect(Number(body.data.totalPrice)).toBe(Number(event.price) * quantity);
  });

  test('the maximum of 10 tickets is accepted and priced correctly', async ({ eventsApi, bookingsApi }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    const booking = await bookingsApi.createBooking(buildBookingInput(event.id, maxQuantity));
    expect(Number(booking.totalPrice)).toBe(Number(event.price) * maxQuantity);
  });

  test('the booking can be read back by id, by reference and from the list (AC3 via API)', async ({ eventsApi, bookingsApi }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    const booking = await bookingsApi.createBooking(buildBookingInput(event.id, quantity));

    const byId = await bookingsApi.get(booking.id);
    expect(byId.status()).toBe(200);
    expect((await byId.json()).data.bookingRef).toBe(booking.bookingRef);

    const byRef = await bookingsApi.getByRef(booking.bookingRef);
    expect(byRef.status()).toBe(200);
    expect((await byRef.json()).data.id).toBe(booking.id);

    const list = await bookingsApi.list({ eventId: event.id, limit: 100 });
    expect(list.status()).toBe(200);
    const refs = (await list.json()).data.map((b: { bookingRef: string }) => b.bookingRef);
    expect(refs).toContain(booking.bookingRef);
  });

  test('available seats decrease by the booked quantity', async ({ eventsApi, bookingsApi }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    await bookingsApi.createBooking(buildBookingInput(event.id, quantity));
    expect((await eventsApi.getEvent(event.id)).availableSeats).toBe(event.availableSeats - quantity);
  });
});
