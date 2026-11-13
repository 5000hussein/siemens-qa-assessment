import { test, expect } from '../../../core/fixtures';
import { readJsonValue, readJsonObject } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { patterns, bookingStatuses, successMessages } from '../../../data/assertions.json';

const eventName = readJsonValue(bookingsDataPath, `${currentEnv}.eventName`);
const createBookingBody = readJsonObject(bookingsDataPath, `${currentEnv}.createBooking`);
const maxQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.quantityLimits.max`));

test.describe('AC5: POST /api/bookings creates a booking', () => {
  test('Check the user is able to create a booking and get 201 with a booking reference, customer details and total = price × quantity', async ({
    eventsApi,
    bookingsApi,
    bookingCleanup,
  }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];
    expect(event?.title).toBe(eventName);

    // Create the booking
    const response = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id });
    expect(response.status()).toBe(201);
    const body = await response.json();
    bookingCleanup.track(body.data.id);
    expect(body.success).toBe(true);
    expect(body.message).toBe(successMessages.booking.apiConfirmed);
    expect(body.data).toMatchObject({ ...createBookingBody, eventId: event.id, status: bookingStatuses.confirmed });
    expect(body.data.bookingRef).toMatch(new RegExp(patterns.bookingRef));
    expect(Number(body.data.totalPrice)).toBe(Number(event.price) * createBookingBody.quantity);
  });

  test('Check the user is able to book the maximum of 10 tickets at the correct total', async ({
    eventsApi,
    bookingsApi,
    bookingCleanup,
  }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];
    expect(event?.title).toBe(eventName);

    // Create the booking with the maximum quantity
    const response = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id, quantity: maxQuantity });
    expect(response.status()).toBe(201);
    const booking = (await response.json()).data;
    bookingCleanup.track(booking.id);
    expect(Number(booking.totalPrice)).toBe(Number(event.price) * maxQuantity);
  });

  test('AC3: Check the user is able to get the created booking by id, by reference and from the bookings list', async ({
    eventsApi,
    bookingsApi,
    bookingCleanup,
  }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];
    expect(event?.title).toBe(eventName);

    // Create the booking
    const createResponse = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;
    bookingCleanup.track(booking.id);

    // Get the booking by id
    const byIdResponse = await bookingsApi.getBooking(booking.id);
    expect(byIdResponse.status()).toBe(200);
    expect((await byIdResponse.json()).data.bookingRef).toBe(booking.bookingRef);

    // Get the booking by reference
    const byRefResponse = await bookingsApi.getBookingByRef(booking.bookingRef);
    expect(byRefResponse.status()).toBe(200);
    expect((await byRefResponse.json()).data.id).toBe(booking.id);

    // Get the bookings list for the event
    const listResponse = await bookingsApi.getBookings({ eventId: event.id, limit: 100 });
    expect(listResponse.status()).toBe(200);
    const refs = (await listResponse.json()).data.map((b: { bookingRef: string }) => b.bookingRef);
    expect(refs).toContain(booking.bookingRef);
  });

  test('Check the user is able to book tickets and the event available seats decrease by the booked quantity', async ({
    eventsApi,
    bookingsApi,
    bookingCleanup,
  }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];
    expect(event?.title).toBe(eventName);

    // Create the booking
    const createResponse = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id });
    expect(createResponse.status()).toBe(201);
    const booking = (await createResponse.json()).data;
    bookingCleanup.track(booking.id);

    // Get the event again: seats went down by the quantity
    const eventResponse = await eventsApi.getEvent(event.id);
    expect(eventResponse.status()).toBe(200);
    expect((await eventResponse.json()).data.availableSeats).toBe(event.availableSeats - createBookingBody.quantity);
  });
});
