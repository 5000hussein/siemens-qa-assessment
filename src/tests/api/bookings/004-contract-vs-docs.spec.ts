import { test, expect } from '../../../core/fixtures';
import { readJsonValue, readJsonObject } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { patterns } from '../../../data/assertions.json';

const eventName = readJsonValue(bookingsDataPath, `${currentEnv}.eventName`);
const createBookingBody = readJsonObject(bookingsDataPath, `${currentEnv}.createBooking`);

// Known mismatches between the API docs (Swagger) and the real responses, written up in docs/story-review.md.
// test.fail() keeps them visible: the run stays green while the defect exists and goes red once it is fixed,
// which is the signal to delete the annotation.
test.describe('API contract vs documentation (known defects)', () => {
  test('Check the user is able to get a booking reference in the documented EVT-XXXXXX format', async ({
    eventsApi,
    bookingsApi,
    bookingCleanup,
  }) => {
    test.fail(true, 'Docs say EVT-XXXXXX; API returns <first letter of event title>-XXXXXX, e.g. D-0VYXU6');

    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];

    // Create the booking
    const response = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id });
    expect(response.status()).toBe(201);
    const booking = (await response.json()).data;
    bookingCleanup.track(booking.id);

    expect(booking.bookingRef).toMatch(new RegExp(patterns.documentedBookingRef));
  });

  test('Check the user is able to get totalPrice as a number as documented', async ({ eventsApi, bookingsApi, bookingCleanup }) => {
    test.fail(true, 'Schema says number (float); API returns a string, e.g. "900"');

    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];

    // Create the booking
    const response = await bookingsApi.createBooking({ ...createBookingBody, eventId: event.id });
    expect(response.status()).toBe(201);
    const booking = (await response.json()).data;
    bookingCleanup.track(booking.id);

    expect(typeof booking.totalPrice).toBe('number');
  });
});
