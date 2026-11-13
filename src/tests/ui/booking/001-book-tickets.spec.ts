import { test, expect } from '../../../core/fixtures';
import { readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { patterns, validationMessages } from '../../../data/assertions.json';
import type { EventItem } from '../../../api/types';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const customerName = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerName`);
const customerEmail = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerEmail`);
const customerPhone = readJsonValue(bookingsDataPath, `${currentEnv}.booking.customerPhone`);
const quantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.booking.quantity`));
const minQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.quantityLimits.min`));
const maxQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.quantityLimits.max`));
const invalidName = readJsonValue(bookingsDataPath, `${currentEnv}.invalidBooking.customerName`);
const invalidEmail = readJsonValue(bookingsDataPath, `${currentEnv}.invalidBooking.customerEmail`);
const invalidPhone = readJsonValue(bookingsDataPath, `${currentEnv}.invalidBooking.customerPhone`);

let event: EventItem;

test.describe('US-114 Book tickets for an event (UI)', () => {
  test.beforeEach(async ({ eventsApi }) => {
    const eventsResponse = await eventsApi.getEvents({ limit: 100 });
    expect(eventsResponse.status()).toBe(200);
    event = (await eventsResponse.json()).data.find((e: EventItem) => e.availableSeats >= minSeats);
  });

  test('AC1 + AC2: Check the user is able to book tickets and see a confirmation with a booking reference and total = price × tickets', async ({
    bookingsApi,
    eventsPage,
    eventDetailsPage,
  }) => {
    // Step 1: Open the event from the events list
    await eventsPage.navigate();
    await eventsPage.openEvent(event.title);
    await eventDetailsPage.verifyPricePerTicket(event.price);

    // Step 2: Choose tickets; the summary recalculates the total (AC2)
    await eventDetailsPage.setTicketQuantity(quantity);
    await eventDetailsPage.verifyPriceSummary(event.price, quantity);

    // Step 3: Enter customer details and confirm
    await eventDetailsPage.fillCustomerDetails(customerName, customerEmail, customerPhone);
    await eventDetailsPage.clickConfirmBooking();

    // Step 4: Confirmation with booking reference (AC1) and the same total (AC2)
    const bookingRef = await eventDetailsPage.getBookingReference();
    expect(bookingRef).toMatch(new RegExp(patterns.bookingRef));
    await eventDetailsPage.verifyConfirmation(customerName, quantity, event.price);

    // Step 5: The backend holds the same booking
    const bookingResponse = await bookingsApi.getBookingByRef(bookingRef);
    expect(bookingResponse.status()).toBe(200);
    const booking = (await bookingResponse.json()).data;
    expect(booking.eventId).toBe(event.id);
    expect(booking.quantity).toBe(quantity);
    expect(Number(booking.totalPrice)).toBe(Number(event.price) * quantity);

    // Clean up
    expect((await bookingsApi.cancelBooking(booking.id)).status()).toBe(200);
  });

  test('AC2: Check the user is able to see the total update for the minimum and maximum ticket count', async ({ eventDetailsPage }) => {
    await eventDetailsPage.navigate(event.id);

    await eventDetailsPage.verifyPriceSummary(event.price, minQuantity);
    await expect(eventDetailsPage.decrementTicketsButton).toBeDisabled();

    await eventDetailsPage.setTicketQuantity(maxQuantity);
    await eventDetailsPage.verifyPriceSummary(event.price, maxQuantity);
    await expect(eventDetailsPage.incrementTicketsButton).toBeDisabled();
  });

  test('AC1 negative: Check the user is not able to book with invalid customer details', async ({ eventDetailsPage }) => {
    await eventDetailsPage.navigate(event.id);

    await eventDetailsPage.fillCustomerDetails(invalidName, invalidEmail, invalidPhone);
    await eventDetailsPage.clickConfirmBooking();

    await eventDetailsPage.verifyValidationMessage(validationMessages.booking.name);
    await eventDetailsPage.verifyValidationMessage(validationMessages.booking.email);
    await eventDetailsPage.verifyValidationMessage(validationMessages.booking.phone);
    await expect(eventDetailsPage.confirmationHeading).toBeHidden();
  });
});
