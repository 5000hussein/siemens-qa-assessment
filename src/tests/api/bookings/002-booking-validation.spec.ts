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

test.describe('AC5 negative: POST /api/bookings rejects invalid requests', () => {
  for (const invalidQuantity of [belowMinQuantity, aboveMaxQuantity]) {
    test(`quantity ${invalidQuantity} returns 400 with the quantity rule`, async ({ eventsApi, bookingsApi }) => {
      const event = await eventsApi.findBookableEvent(minSeats);
      const response = await bookingsApi.create({
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
    test(`invalid ${field} returns 400 naming the field`, async ({ eventsApi, bookingsApi }) => {
      const event = await eventsApi.findBookableEvent(minSeats);
      const invalidValue = readJsonValue(bookingsDataPath, `${currentEnv}.invalidBooking.${field}`);

      const response = await bookingsApi.create({
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

  test('missing body fields return 400', async ({ bookingsApi }) => {
    const response = await bookingsApi.create({});
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe(validationMessages.api.validationFailed);
  });

  test('unknown event returns 404', async ({ bookingsApi }) => {
    const response = await bookingsApi.create({ eventId: notFoundEventId, customerName, customerEmail, customerPhone, quantity });
    expect(response.status()).toBe(404);
  });

  test('request without a token returns 401', async ({ anonymousBookingsApi, eventsApi }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    const response = await anonymousBookingsApi.create({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });
    expect(response.status()).toBe(401);
    expect((await response.json()).error).toBe(validationMessages.api.unauthorized);
  });
});
