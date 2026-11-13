import { type Page, type Locator, expect } from '@playwright/test';
import { CommonPage } from './CommonPage';
import type { EventItem } from '../api/types';
import { formatPrice } from '../utils/format';
import { TIMEOUTS } from '../utils/timeouts';

export class BookingDetailsPage extends CommonPage {
  // ========== HEADER ==========
  readonly eventTitle: Locator;
  readonly breadcrumb: Locator;

  // ========== EVENT DETAILS ==========
  readonly eventName: Locator;
  readonly eventCategory: Locator;
  readonly eventVenue: Locator;
  readonly eventCity: Locator;

  // ========== CUSTOMER DETAILS ==========
  readonly customerName: Locator;
  readonly customerEmail: Locator;
  readonly customerPhone: Locator;

  // ========== PAYMENT SUMMARY ==========
  readonly ticketCount: Locator;
  readonly pricePerTicket: Locator;
  readonly totalPaid: Locator;

  constructor(page: Page) {
    super(page);

    // ========== HEADER ==========
    this.eventTitle = page.getByRole('heading', { level: 1 });
    this.breadcrumb = page.getByRole('main').getByRole('navigation');

    // ========== EVENT DETAILS ==========
    this.eventName = this.sectionValue('Event Details', 'Event');
    this.eventCategory = this.sectionValue('Event Details', 'Category');
    this.eventVenue = this.sectionValue('Event Details', 'Venue');
    this.eventCity = this.sectionValue('Event Details', 'City');

    // ========== CUSTOMER DETAILS ==========
    this.customerName = this.sectionValue('Customer Details', 'Name');
    this.customerEmail = this.sectionValue('Customer Details', 'Email');
    this.customerPhone = this.sectionValue('Customer Details', 'Phone');

    // ========== PAYMENT SUMMARY ==========
    this.ticketCount = this.sectionValue('Payment Summary', 'Tickets');
    this.pricePerTicket = this.sectionValue('Payment Summary', 'Price per ticket');
    this.totalPaid = this.sectionValue('Payment Summary', 'Total Paid');
  }

  // Values are rendered as <span>Label</span><span>Value</span> siblings under each section's h2
  private sectionValue(section: string, label: string): Locator {
    return this.page.locator(
      `//*[normalize-space()="${section}"]/following-sibling::div//span[normalize-space()="${label}"]/following-sibling::span`
    );
  }

  // The ref is shown twice on the page, so it is scoped to the breadcrumb; the status badge sits next to it
  bookingRefInBreadcrumb(bookingRef: string): Locator {
    return this.breadcrumb.getByText(bookingRef, { exact: true });
  }

  statusBadge(bookingRef: string): Locator {
    return this.page.locator(`//span[normalize-space()="${bookingRef}"]/following-sibling::span`);
  }

  // ========== VERIFICATIONS ==========
  async verifyBookingHeader(bookingRef: string, status: string): Promise<void> {
    await expect(this.bookingRefInBreadcrumb(bookingRef)).toBeVisible({ timeout: TIMEOUTS.medium });
    await expect(this.statusBadge(bookingRef)).toHaveText(status);
  }

  // The event date is not asserted: it renders in the browser's local timezone
  async verifyEventDetails(event: EventItem): Promise<void> {
    await expect(this.eventTitle).toHaveText(event.title, { timeout: TIMEOUTS.medium });
    await expect(this.eventName).toHaveText(event.title);
    await expect(this.eventCategory).toHaveText(event.category);
    await expect(this.eventVenue).toHaveText(event.venue);
    await expect(this.eventCity).toHaveText(event.city);
  }

  async verifyCustomerDetails(name: string, email: string, phone: string): Promise<void> {
    await expect(this.customerName).toHaveText(name, { timeout: TIMEOUTS.medium });
    await expect(this.customerEmail).toHaveText(email);
    await expect(this.customerPhone).toHaveText(phone);
  }

  async verifyPaymentSummary(quantity: number, price: number | string): Promise<void> {
    await expect(this.ticketCount).toHaveText(String(quantity), { timeout: TIMEOUTS.medium });
    await expect(this.pricePerTicket).toHaveText(formatPrice(price));
    await expect(this.totalPaid).toHaveText(formatPrice(Number(price) * quantity));
  }
}
