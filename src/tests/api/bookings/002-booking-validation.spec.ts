import { test, expect } from '../../../core/fixtures';
import { readJsonValue, readJsonObject } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { validationMessages } from '../../../data/assertions.json';

const eventName = readJsonValue(bookingsDataPath, `${currentEnv}.eventName`);
const createBookingBody = readJsonObject(bookingsDataPath, `${currentEnv}.createBooking`);
const belowMinQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.quantityLimits.belowMin`));
const aboveMaxQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.quantityLimits.aboveMax`));
const notFoundEventId = Number(readJsonValue(bookingsDataPath, `${currentEnv}.notFound.eventId`));

test.describe('AC5 negative: POST /api/bookings rejects invalid requests', () => {
  for (const invalidQuantity of [belowMinQuantity, aboveMaxQuantity]) {
    test(`Check the user is not able to book ${invalidQuantity} tickets (400 with the quantity rule)`, async ({
      eventsApi,
      bookingsApi,
    }) => {
      // Get the event by name
      const eventsResponse = await eventsApi.getEvents({ search: eventName });
      expect(eventsResponse.status()).toBe(200);
      const event = (await eventsResponse.json()).data[0];
      expect(event?.title).toBe(eventName);

      // Create the booking with an invalid quantity
      const response = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id, quantity: invalidQuantity });
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe(validationMessages.api.validationFailed);
      expect(body.details).toContainEqual({ field: 'quantity', message: validationMessages.api.quantityRange });
    });
  }

  for (const field of ['customerName', 'customerEmail', 'customerPhone']) {
    test(`Check the user is not able to book with an invalid ${field} (400 naming the field)`, async ({ eventsApi, bookingsApi }) => {
      const invalidValue = readJsonValue(bookingsDataPath, `${currentEnv}.invalidBooking.${field}`);

      // Get the event by name
      const eventsResponse = await eventsApi.getEvents({ search: eventName });
      expect(eventsResponse.status()).toBe(200);
      const event = (await eventsResponse.json()).data[0];
      expect(event?.title).toBe(eventName);

      // Create the booking with one invalid field
      const response = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id, [field]: invalidValue });
      expect(response.status()).toBe(400);
      const fields = (await response.json()).details.map((d: { field: string }) => d.field);
      expect(fields).toContain(field);
    });
  }

  test('Check the user is not able to book with an empty request body (400)', async ({ bookingsApi }) => {
    const response = await bookingsApi.createBooking({});
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe(validationMessages.api.validationFailed);
  });

  test('Check the user is not able to book an event that does not exist (404)', async ({ bookingsApi }) => {
    const response = await bookingsApi.createBooking({ ...createBookingBody, eventId: notFoundEventId });
    expect(response.status()).toBe(404);
  });

  test('Check the user is not able to book without a token (401)', async ({ eventsApi, anonymousBookingsApi }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];
    expect(event?.title).toBe(eventName);

    // Create the booking without a token
    const response = await anonymousBookingsApi.createBooking({ ...createBookingBody, eventId: event.id });
    expect(response.status()).toBe(401);
    expect((await response.json()).error).toBe(validationMessages.api.unauthorized);
  });
});
