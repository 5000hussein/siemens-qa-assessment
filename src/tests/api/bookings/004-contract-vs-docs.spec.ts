import { test, expect } from '../../../core/baseTest';
import { readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { buildBookingInput } from '../../../data/builders/bookingBuilder';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const quantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.api.quantity`));

// Known mismatches between the API docs (Swagger) and the real responses, written up in the README story review.
// test.fail() keeps them visible: the run stays green while the defect exists and goes red once it is fixed,
// which is the signal to delete the annotation.
test.describe('API contract vs documentation (known defects)', () => {
  test('bookingRef follows the documented EVT-XXXXXX format', async ({ eventsApi, bookingsApi }) => {
    test.fail(true, 'Docs say EVT-XXXXXX; API returns <first letter of event title>-XXXXXX, e.g. D-0VYXU6');
    const event = await eventsApi.findBookableEvent(minSeats);
    const booking = await bookingsApi.createBooking(buildBookingInput(event.id, quantity));
    expect(booking.bookingRef).toMatch(/^EVT-[A-Z0-9]{6}$/);
  });

  test('totalPrice is a number as documented', async ({ eventsApi, bookingsApi }) => {
    test.fail(true, 'Schema says number (float); API returns a string, e.g. "900"');
    const event = await eventsApi.findBookableEvent(minSeats);
    const booking = await bookingsApi.createBooking(buildBookingInput(event.id, quantity));
    expect(typeof booking.totalPrice).toBe('number');
  });
});
