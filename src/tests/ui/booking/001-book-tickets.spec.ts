import { test, expect } from '../../../core/fixtures';
import { readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { patterns, validationMessages } from '../../../data/assertions.json';

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

test.describe('US-114 Book tickets for an event (UI)', () => {
  test('AC1 + AC2: booking shows a confirmation with a reference and total = price × tickets', async ({
    eventsApi,
    bookingsApi,
    eventsPage,
    eventDetailsPage,
  }) => {
    const event = await eventsApi.findBookableEvent(minSeats);

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

    // Step 5: The backend holds the same booking (also registers it for teardown cleanup)
    const booking = await bookingsApi.trackByRef(bookingRef);
    expect(booking.eventId).toBe(event.id);
    expect(booking.quantity).toBe(quantity);
    expect(Number(booking.totalPrice)).toBe(Number(event.price) * quantity);
  });

  test('AC2: total updates for the minimum and maximum ticket count', async ({ eventsApi, eventDetailsPage }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    await eventDetailsPage.navigate(event.id);

    await eventDetailsPage.verifyPriceSummary(event.price, minQuantity);
    await expect(eventDetailsPage.decrementTicketsButton).toBeDisabled();

    await eventDetailsPage.setTicketQuantity(maxQuantity);
    await eventDetailsPage.verifyPriceSummary(event.price, maxQuantity);
    await expect(eventDetailsPage.incrementTicketsButton).toBeDisabled();
  });

  test('AC1 negative: invalid customer details are rejected and no booking is created', async ({ eventsApi, eventDetailsPage }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    await eventDetailsPage.navigate(event.id);

    await eventDetailsPage.fillCustomerDetails(invalidName, invalidEmail, invalidPhone);
    await eventDetailsPage.clickConfirmBooking();

    await eventDetailsPage.verifyValidationMessage(validationMessages.booking.name);
    await eventDetailsPage.verifyValidationMessage(validationMessages.booking.email);
    await eventDetailsPage.verifyValidationMessage(validationMessages.booking.phone);
    await expect(eventDetailsPage.confirmationHeading).toBeHidden();
  });
});
