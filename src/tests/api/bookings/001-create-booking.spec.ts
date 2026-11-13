import { test, expect } from '../../../core/fixtures';
import { readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { patterns, bookingStatuses, successMessages } from '../../../data/assertions.json';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const customerName = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerName`);
const customerEmail = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerEmail`);
const customerPhone = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerPhone`);
const quantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.booking.quantity`));
const maxQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.quantityLimits.max`));

test.describe('AC5: POST /api/bookings creates a booking', () => {
  test('201 with booking reference, customer details and total = price × quantity', async ({ eventsApi, bookingsApi }) => {
    const event = await eventsApi.findBookableEvent(minSeats);

    const response = await bookingsApi.create({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toBe(successMessages.booking.apiConfirmed);
    expect(body.data).toMatchObject({
      eventId: event.id,
      customerName,
      customerEmail,
      customerPhone,
      quantity,
      status: bookingStatuses.confirmed,
    });
    expect(body.data.bookingRef).toMatch(new RegExp(patterns.bookingRef));
    expect(Number(body.data.totalPrice)).toBe(Number(event.price) * quantity);
  });

  test('the maximum of 10 tickets is accepted and priced correctly', async ({ eventsApi, bookingsApi }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    const booking = await bookingsApi.createBooking({
      eventId: event.id,
      customerName,
      customerEmail,
      customerPhone,
      quantity: maxQuantity,
    });
    expect(Number(booking.totalPrice)).toBe(Number(event.price) * maxQuantity);
  });

  test('the booking can be read back by id, by reference and from the list (AC3 via API)', async ({ eventsApi, bookingsApi }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    const booking = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });

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
    await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });
    expect((await eventsApi.getEvent(event.id)).availableSeats).toBe(event.availableSeats - quantity);
  });
});
