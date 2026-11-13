import { test, expect } from '../../../core/fixtures';
import { readJsonValue, readJsonObject } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { patterns, validationMessages } from '../../../data/assertions.json';

const eventName = readJsonValue(bookingsDataPath, `${currentEnv}.eventName`);
const createBookingBody = readJsonObject(bookingsDataPath, `${currentEnv}.createBooking`);
const minQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.quantityLimits.min`));
const maxQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.quantityLimits.max`));
const invalidBooking = readJsonObject(bookingsDataPath, `${currentEnv}.invalidBooking`);

test.describe('US-114 Book tickets for an event (UI)', () => {
  test('AC1 + AC2: Check the user is able to book tickets and see a confirmation with a booking reference and total = price × tickets', async ({
    eventsApi,
    bookingsApi,
    bookingCleanup,
    eventsPage,
    eventDetailsPage,
  }) => {
    // Get the event by name (for its price)
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];

    // Open the event from the events list
    await eventsPage.navigate();
    await eventsPage.openEvent(eventName);
    await eventDetailsPage.verifyPricePerTicket(event.price);

    // Choose tickets: the summary recalculates the total (AC2)
    await eventDetailsPage.setTicketQuantity(createBookingBody.quantity);
    await eventDetailsPage.verifyPriceSummary(event.price, createBookingBody.quantity);

    // Enter customer details and confirm
    await eventDetailsPage.fillCustomerDetails(
      createBookingBody.customerName,
      createBookingBody.customerEmail,
      createBookingBody.customerPhone
    );
    await eventDetailsPage.clickConfirmBooking();

    // Look the booking up by its reference so the teardown cancels it even if a check below fails
    const bookingRef = await eventDetailsPage.getBookingReference();
    const bookingResponse = await bookingsApi.getBookingByRef(bookingRef);
    expect(bookingResponse.status()).toBe(200);
    const savedBooking = (await bookingResponse.json()).data;
    bookingCleanup.track(savedBooking.id);

    // Confirmation with booking reference (AC1) and the same total (AC2)
    expect(bookingRef).toMatch(new RegExp(patterns.bookingRef));
    await eventDetailsPage.verifyConfirmation(createBookingBody.customerName, createBookingBody.quantity, event.price);

    // The backend holds the same booking
    expect(savedBooking.eventId).toBe(event.id);
    expect(savedBooking.quantity).toBe(createBookingBody.quantity);
    expect(Number(savedBooking.totalPrice)).toBe(Number(event.price) * createBookingBody.quantity);
  });

  test('AC2: Check the user is able to see the total update for the minimum and maximum ticket count', async ({
    eventsApi,
    eventDetailsPage,
  }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];

    // Open the event
    await eventDetailsPage.navigate(event.id);

    // Minimum: total for 1 ticket, minus button disabled
    await eventDetailsPage.verifyPriceSummary(event.price, minQuantity);
    await expect(eventDetailsPage.decrementTicketsButton).toBeDisabled();

    // Maximum: total for 10 tickets, plus button disabled
    await eventDetailsPage.setTicketQuantity(maxQuantity);
    await eventDetailsPage.verifyPriceSummary(event.price, maxQuantity);
    await expect(eventDetailsPage.incrementTicketsButton).toBeDisabled();
  });

  test('AC1 negative: Check the user is not able to book with invalid customer details', async ({ eventsApi, eventDetailsPage }) => {
    // Get the event by name
    const eventsResponse = await eventsApi.getEvents({ search: eventName });
    expect(eventsResponse.status()).toBe(200);
    const event = (await eventsResponse.json()).data[0];

    // Open the event, enter invalid details and confirm
    await eventDetailsPage.navigate(event.id);
    await eventDetailsPage.fillCustomerDetails(invalidBooking.customerName, invalidBooking.customerEmail, invalidBooking.customerPhone);
    await eventDetailsPage.clickConfirmBooking();

    // Validation messages show and no booking is confirmed
    await eventDetailsPage.verifyValidationMessage(validationMessages.booking.name);
    await eventDetailsPage.verifyValidationMessage(validationMessages.booking.email);
    await eventDetailsPage.verifyValidationMessage(validationMessages.booking.phone);
    await expect(eventDetailsPage.confirmationHeading).toBeHidden();
  });
});
