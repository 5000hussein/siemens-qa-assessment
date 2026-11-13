import { type Page, type Locator, expect } from '@playwright/test';
import { CommonPage } from './CommonPage';
import { ROUTES } from '../config/routes';
import { successMessages } from '../data/assertions.json';
import { formatPrice } from '../utils/format';
import { TIMEOUTS } from '../utils/timeouts';

export class EventDetailsPage extends CommonPage {
  // ========== EVENT INFO ==========
  readonly eventTitle: Locator;
  readonly pricePerTicket: Locator;
  readonly availableSeats: Locator;

  // ========== BOOKING FORM ==========
  readonly bookingForm: Locator;
  readonly ticketCount: Locator;
  readonly incrementTicketsButton: Locator;
  readonly decrementTicketsButton: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly priceBreakdown: Locator;
  readonly totalPrice: Locator;
  readonly confirmBookingButton: Locator;

  // ========== CONFIRMATION ==========
  readonly confirmationHeading: Locator;
  readonly confirmationCard: Locator;
  readonly viewMyBookingsLink: Locator;

  constructor(page: Page) {
    super(page);

    // ========== EVENT INFO ==========
    this.eventTitle = page.getByRole('heading', { level: 1 });
    this.pricePerTicket = page.locator('//p[normalize-space()="Price per ticket"]/following-sibling::p');
    this.availableSeats = page.locator('//p[normalize-space()="Available"]/following-sibling::p');

    // ========== BOOKING FORM ==========
    this.bookingForm = page.locator('form').filter({ has: page.getByRole('button', { name: 'Confirm Booking' }) });
    this.ticketCount = page.locator('#ticket-count');
    this.incrementTicketsButton = this.bookingForm.getByRole('button', { name: '+' });
    this.decrementTicketsButton = this.bookingForm.getByRole('button', { name: '−' });
    this.fullNameInput = this.bookingForm.getByRole('textbox', { name: 'Full Name' });
    this.emailInput = this.bookingForm.getByRole('textbox', { name: 'Email' });
    this.phoneInput = this.bookingForm.getByRole('textbox', { name: 'Phone Number' });
    // React splits "$300 × 1 ticket" into several text nodes, so match on the span's full text instead of text()
    this.priceBreakdown = this.bookingForm.locator('span', { hasText: '×' });
    this.totalPrice = this.bookingForm.locator('//span[normalize-space()="Total"]/following-sibling::span');
    this.confirmBookingButton = this.bookingForm.getByRole('button', { name: 'Confirm Booking' });

    // ========== CONFIRMATION ==========
    this.confirmationHeading = page.getByRole('heading', { name: successMessages.booking.confirmedHeading });
    this.confirmationCard = page.locator('div').filter({ has: this.confirmationHeading }).last();
    this.viewMyBookingsLink = page.getByRole('link', { name: 'View My Bookings' });
  }

  // ========== NAVIGATION ==========
  async navigate(eventId: number): Promise<void> {
    await this.navigateTo(ROUTES.eventDetails(eventId));
    await this.confirmBookingButton.waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
  }

  // ========== BOOKING FORM ACTIONS ==========
  async setTicketQuantity(quantity: number): Promise<void> {
    await this.ticketCount.waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
    while (Number(await this.ticketCount.textContent()) < quantity) await this.incrementTicketsButton.click();
    while (Number(await this.ticketCount.textContent()) > quantity) await this.decrementTicketsButton.click();
    await expect(this.ticketCount).toHaveText(String(quantity));
  }

  async fillCustomerDetails(name: string, email: string, phone: string): Promise<void> {
    await this.typeText(this.fullNameInput, name);
    await this.typeText(this.emailInput, email);
    await this.typeText(this.phoneInput, phone);
  }

  async clickConfirmBooking(): Promise<void> {
    await this.click(this.confirmBookingButton);
  }

  async bookTickets(quantity: number, name: string, email: string, phone: string): Promise<void> {
    await this.setTicketQuantity(quantity);
    await this.fillCustomerDetails(name, email, phone);
    await this.clickConfirmBooking();
  }

  // ========== VERIFICATIONS ==========
  async verifyPricePerTicket(price: number | string): Promise<void> {
    await expect(this.pricePerTicket).toHaveText(formatPrice(price), { timeout: TIMEOUTS.medium });
  }

  async verifyPriceSummary(price: number | string, quantity: number): Promise<void> {
    const ticketLabel = quantity === 1 ? 'ticket' : 'tickets';
    await expect(this.priceBreakdown).toHaveText(`${formatPrice(price)} × ${quantity} ${ticketLabel}`);
    await expect(this.totalPrice).toHaveText(formatPrice(Number(price) * quantity));
  }

  async verifyValidationMessage(message: string): Promise<void> {
    await expect(this.bookingForm.getByText(message)).toBeVisible({ timeout: TIMEOUTS.short });
  }

  // ========== CONFIRMATION ==========
  async getBookingReference(): Promise<string> {
    await this.confirmationHeading.waitFor({ state: 'visible', timeout: TIMEOUTS.long });
    const cardText = await this.confirmationCard.innerText();
    const match = cardText.match(/Booking Ref\s*([A-Z0-9]+-[A-Z0-9]+)/);
    if (!match) throw new Error(`Booking reference not found in confirmation: ${cardText}`);
    return match[1];
  }

  async verifyConfirmation(customerName: string, quantity: number, price: number | string): Promise<void> {
    await expect(this.confirmationHeading).toBeVisible({ timeout: TIMEOUTS.long });
    await expect(this.confirmationCard).toContainText(successMessages.booking.ticketsReserved);
    await expect(this.confirmationCard).toContainText(customerName);
    await expect(this.confirmationCard).toContainText(new RegExp(`Tickets\\s*${quantity}`));
    await expect(this.confirmationCard).toContainText(new RegExp(`Total\\s*\\${formatPrice(Number(price) * quantity)}`));
  }

  async clickViewMyBookings(): Promise<void> {
    await this.click(this.viewMyBookingsLink);
    await this.page.waitForURL(`**${ROUTES.myBookings}`, { timeout: TIMEOUTS.medium });
  }
}
