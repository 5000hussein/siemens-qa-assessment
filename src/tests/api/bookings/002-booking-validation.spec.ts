import { test, expect } from '../../../core/fixtures';
import { readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { validationMessages } from '../../../data/assertions.json';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const customerName = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerName`);
const customerEmail = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerEmail`);
const customerPhone = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerPhone`);
const quantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.booking.quantity`));
const belowMinQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.quantityLimits.belowMin`));
const aboveMaxQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.quantityLimits.aboveMax`));
const notFoundEventId = Number(readJsonValue(bookingsDataPath, `${currentEnv}.notFound.eventId`));

let event: any;

test.describe('AC5 negative: POST /api/bookings rejects invalid requests', () => {
  test.beforeEach(async ({ eventsApi }) => {
    const eventsResponse = await eventsApi.getEvents({ limit: 100 });
    expect(eventsResponse.status()).toBe(200);
    event = (await eventsResponse.json()).data.find((e: any) => e.availableSeats >= minSeats);
  });

  for (const invalidQuantity of [belowMinQuantity, aboveMaxQuantity]) {
    test(`Check the user is not able to book ${invalidQuantity} tickets (400 with the quantity rule)`, async ({ bookingsApi }) => {
      const response = await bookingsApi.createBooking({
        eventId: event.id,
        customerName,
        customerEmail,
        customerPhone,
        quantity: invalidQuantity,
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe(validationMessages.api.validationFailed);
      expect(body.details).toContainEqual({ field: 'quantity', message: validationMessages.api.quantityRange });
    });
  }

  for (const field of ['customerName', 'customerEmail', 'customerPhone']) {
    test(`Check the user is not able to book with an invalid ${field} (400 naming the field)`, async ({ bookingsApi }) => {
      const invalidValue = readJsonValue(bookingsDataPath, `${currentEnv}.invalidBooking.${field}`);

      const response = await bookingsApi.createBooking({
        eventId: event.id,
        customerName,
        customerEmail,
        customerPhone,
        quantity,
        [field]: invalidValue,
      });

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
    const response = await bookingsApi.createBooking({ eventId: notFoundEventId, customerName, customerEmail, customerPhone, quantity });

    expect(response.status()).toBe(404);
  });

  test('Check the user is not able to book without a token (401)', async ({ anonymousBookingsApi }) => {
    const response = await anonymousBookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });

    expect(response.status()).toBe(401);
    expect((await response.json()).error).toBe(validationMessages.api.unauthorized);
  });
});
