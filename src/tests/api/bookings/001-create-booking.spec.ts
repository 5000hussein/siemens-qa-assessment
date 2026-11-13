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

let event: any;

test.describe('AC5: POST /api/bookings creates a booking', () => {
  test.beforeEach(async ({ eventsApi }) => {
    const eventsResponse = await eventsApi.getEvents({ limit: 100 });
    expect(eventsResponse.status()).toBe(200);
    event = (await eventsResponse.json()).data.find((e: any) => e.availableSeats >= minSeats);
  });

  test('Check the user is able to create a booking and get 201 with a booking reference, customer details and total = price × quantity', async ({
    bookingsApi,
  }) => {
    const response = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });

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

    expect((await bookingsApi.cancelBooking(body.data.id)).status()).toBe(200);
  });

  test('Check the user is able to book the maximum of 10 tickets at the correct total', async ({ bookingsApi }) => {
    const response = await bookingsApi.createBooking({
      eventId: event.id,
      customerName,
      customerEmail,
      customerPhone,
      quantity: maxQuantity,
    });

    expect(response.status()).toBe(201);
    const booking = (await response.json()).data;
    expect(Number(booking.totalPrice)).toBe(Number(event.price) * maxQuantity);

    expect((await bookingsApi.cancelBooking(booking.id)).status()).toBe(200);
  });

  test('AC3: Check the user is able to get the created booking by id, by reference and from the bookings list', async ({ bookingsApi }) => {
    const createResponse = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;

    const byIdResponse = await bookingsApi.getBooking(booking.id);
    expect(byIdResponse.status()).toBe(200);
    expect((await byIdResponse.json()).data.bookingRef).toBe(booking.bookingRef);

    const byRefResponse = await bookingsApi.getBookingByRef(booking.bookingRef);
    expect(byRefResponse.status()).toBe(200);
    expect((await byRefResponse.json()).data.id).toBe(booking.id);

    const listResponse = await bookingsApi.getBookings({ eventId: event.id, limit: 100 });
    expect(listResponse.status()).toBe(200);
    const refs = (await listResponse.json()).data.map((b: { bookingRef: string }) => b.bookingRef);
    expect(refs).toContain(booking.bookingRef);

    expect((await bookingsApi.cancelBooking(booking.id)).status()).toBe(200);
  });

  test('Check the user is able to book tickets and the event available seats decrease by the booked quantity', async ({
    eventsApi,
    bookingsApi,
  }) => {
    const createResponse = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;

    const eventResponse = await eventsApi.getEvent(event.id);
    expect(eventResponse.status()).toBe(200);
    expect((await eventResponse.json()).data.availableSeats).toBe(event.availableSeats - quantity);

    expect((await bookingsApi.cancelBooking(booking.id)).status()).toBe(200);
  });
});
