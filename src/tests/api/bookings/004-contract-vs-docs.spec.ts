import { test, expect } from '../../../core/fixtures';
import { readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { patterns } from '../../../data/assertions.json';
import type { EventItem } from '../../../api/types';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const customerName = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerName`);
const customerEmail = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerEmail`);
const customerPhone = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerPhone`);
const quantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.booking.quantity`));

let event: EventItem;
let bookingId: number;

// Known mismatches between the API docs (Swagger) and the real responses, written up in docs/story-review.md.
// test.fail() keeps them visible: the run stays green while the defect exists and goes red once it is fixed,
// which is the signal to delete the annotation.
test.describe('API contract vs documentation (known defects)', () => {
  test.beforeEach(async ({ eventsApi }) => {
    const eventsResponse = await eventsApi.getEvents({ limit: 100 });
    expect(eventsResponse.status()).toBe(200);
    event = (await eventsResponse.json()).data.find((e: EventItem) => e.availableSeats >= minSeats);
  });

  // The assertions below are expected to fail, so the booking is cancelled here rather than at the end of the test
  test.afterEach(async ({ bookingsApi }) => {
    expect((await bookingsApi.cancelBooking(bookingId)).status()).toBe(200);
  });

  test('bookingRef follows the documented EVT-XXXXXX format', async ({ bookingsApi }) => {
    test.fail(true, 'Docs say EVT-XXXXXX; API returns <first letter of event title>-XXXXXX, e.g. D-0VYXU6');
    const response = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });
    expect(response.status()).toBe(201);
    const booking = (await response.json()).data;
    bookingId = booking.id;

    expect(booking.bookingRef).toMatch(new RegExp(patterns.documentedBookingRef));
  });

  test('totalPrice is a number as documented', async ({ bookingsApi }) => {
    test.fail(true, 'Schema says number (float); API returns a string, e.g. "900"');
    const response = await bookingsApi.createBooking({ eventId: event.id, customerName, customerEmail, customerPhone, quantity });
    expect(response.status()).toBe(201);
    const booking = (await response.json()).data;
    bookingId = booking.id;

    expect(typeof booking.totalPrice).toBe('number');
  });
});
