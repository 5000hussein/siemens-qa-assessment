import { test, expect } from '../../../core/baseTest';
import { readJsonObject, readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { buildBookingInput } from '../../../data/builders/bookingBuilder';
import { validationMessages } from '../../../config/assertions';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const invalidCustomer = readJsonObject(bookingsDataPath, `${currentEnv}.invalidCustomer`);
const apiData = readJsonObject(bookingsDataPath, `${currentEnv}.api`);

test.describe('AC5 negative: POST /api/bookings rejects invalid requests', () => {
  for (const invalidQuantity of [apiData.zeroQuantity, apiData.aboveMaxQuantity]) {
    test(`quantity ${invalidQuantity} returns 400 with the quantity rule`, async ({ eventsApi, bookingsApi }) => {
      const event = await eventsApi.findBookableEvent(minSeats);
      const response = await bookingsApi.create(buildBookingInput(event.id, invalidQuantity));

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toBe(validationMessages.api.validationFailed);
      expect(body.details).toContainEqual({ field: 'quantity', message: validationMessages.api.quantityRange });
    });
  }

  const invalidFields = [
    { field: 'customerName', value: invalidCustomer.shortName },
    { field: 'customerEmail', value: invalidCustomer.invalidEmail },
    { field: 'customerPhone', value: invalidCustomer.shortPhone },
  ];
  for (const { field, value } of invalidFields) {
    test(`invalid ${field} returns 400 naming the field`, async ({ eventsApi, bookingsApi }) => {
      const event = await eventsApi.findBookableEvent(minSeats);
      const response = await bookingsApi.create(buildBookingInput(event.id, apiData.quantity, { [field]: value }));

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
    const response = await bookingsApi.create(buildBookingInput(apiData.notFoundEventId, apiData.quantity));
    expect(response.status()).toBe(404);
  });

  test('request without a token returns 401', async ({ anonymousBookingsApi, eventsApi }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    const response = await anonymousBookingsApi.create(buildBookingInput(event.id, apiData.quantity));
    expect(response.status()).toBe(401);
    expect((await response.json()).error).toBe(validationMessages.api.unauthorized);
  });
});
