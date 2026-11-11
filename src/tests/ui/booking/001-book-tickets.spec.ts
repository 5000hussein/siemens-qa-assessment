import { test, expect } from '../../../core/baseTest';
import { readJsonObject, readJsonValue } from '../../../utils/jsonHelper';
import { currentEnv, bookingsDataPath } from '../../../config/environment';
import { bookingRefPattern, validationMessages } from '../../../config/assertions';

const minSeats = Number(readJsonValue(bookingsDataPath, `${currentEnv}.minAvailableSeats`));
const customer = readJsonObject(bookingsDataPath, `${currentEnv}.customer`);
const invalidCustomer = readJsonObject(bookingsDataPath, `${currentEnv}.invalidCustomer`);
const quantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.ui.quantity`));
const singleQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.ui.singleQuantity`));
const maxQuantity = Number(readJsonValue(bookingsDataPath, `${currentEnv}.ui.maxQuantity`));

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
    await eventDetailsPage.fillCustomerDetails(customer.name, customer.email, customer.phone);
    await eventDetailsPage.clickConfirmBooking();

    // Step 4: Confirmation with booking reference (AC1) and the same total (AC2)
    const bookingRef = await eventDetailsPage.getBookingReference();
    expect(bookingRef).toMatch(bookingRefPattern);
    await eventDetailsPage.verifyConfirmation(customer.name, quantity, event.price);

    // Step 5: The backend holds the same booking (also registers it for teardown cleanup)
    const booking = await bookingsApi.trackByRef(bookingRef);
    expect(booking.eventId).toBe(event.id);
    expect(booking.quantity).toBe(quantity);
    expect(Number(booking.totalPrice)).toBe(Number(event.price) * quantity);
  });

  test('AC2: total updates for the minimum and maximum ticket count', async ({ eventsApi, eventDetailsPage }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    await eventDetailsPage.navigate(event.id);

    await eventDetailsPage.verifyPriceSummary(event.price, singleQuantity);
    await expect(eventDetailsPage.decrementTicketsButton).toBeDisabled();

    await eventDetailsPage.setTicketQuantity(maxQuantity);
    await eventDetailsPage.verifyPriceSummary(event.price, maxQuantity);
    await expect(eventDetailsPage.incrementTicketsButton).toBeDisabled();
  });

  test('AC1 negative: invalid customer details are rejected and no booking is created', async ({ eventsApi, eventDetailsPage }) => {
    const event = await eventsApi.findBookableEvent(minSeats);
    await eventDetailsPage.navigate(event.id);

    await eventDetailsPage.fillCustomerDetails(invalidCustomer.shortName, invalidCustomer.invalidEmail, invalidCustomer.shortPhone);
    await eventDetailsPage.clickConfirmBooking();

    await eventDetailsPage.verifyValidationMessage(validationMessages.booking.name);
    await eventDetailsPage.verifyValidationMessage(validationMessages.booking.email);
    await eventDetailsPage.verifyValidationMessage(validationMessages.booking.phone);
    await expect(eventDetailsPage.confirmationHeading).toBeHidden();
  });
});
