import { type Page, type Locator, expect } from '@playwright/test';
import { CommonPage } from './CommonPage';
import { ROUTES } from '../config/routes';
import { dialogs } from '../config/assertions';
import { formatPrice } from '../utils/format';
import { TIMEOUTS } from '../utils/timeouts';

export class MyBookingsPage extends CommonPage {
  // ========== BOOKING LIST ==========
  readonly heading: Locator;
  readonly bookingCards: Locator;

  // ========== CANCEL DIALOG ==========
  readonly cancelDialog: Locator;
  readonly confirmCancelButton: Locator;

  constructor(page: Page) {
    super(page);

    // ========== BOOKING LIST ==========
    this.heading = page.getByRole('heading', { name: 'My Bookings', level: 1 });
    this.bookingCards = page.getByTestId('booking-card');

    // ========== CANCEL DIALOG ==========
    this.cancelDialog = page.getByRole('dialog', { name: dialogs.cancelBooking.title });
    this.confirmCancelButton = this.cancelDialog.getByRole('button', { name: dialogs.cancelBooking.confirmButton });
  }

  // ========== NAVIGATION ==========
  async navigate(): Promise<void> {
    await this.navigateTo(ROUTES.myBookings);
    await this.heading.waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
  }

  // "Clear all bookings" is deliberately not modelled: on a shared account it would delete other tests' data
  bookingCard(bookingRef: string): Locator {
    return this.bookingCards.filter({ hasText: bookingRef });
  }

  // ========== VERIFICATIONS ==========
  async verifyBookingListed(
    bookingRef: string,
    eventTitle: string,
    quantity: number,
    price: number | string,
    status: string
  ): Promise<void> {
    const card = this.bookingCard(bookingRef);
    await expect(card).toBeVisible({ timeout: TIMEOUTS.medium });
    await expect(card.getByRole('heading', { name: eventTitle })).toBeVisible();
    await expect(card).toContainText(status);
    await expect(card).toContainText(`${quantity} ${quantity === 1 ? 'ticket' : 'tickets'}`);
    await expect(card).toContainText(formatPrice(Number(price) * quantity));
  }

  async verifyBookingNotListed(bookingRef: string): Promise<void> {
    await expect(this.bookingCard(bookingRef)).toHaveCount(0, { timeout: TIMEOUTS.medium });
  }

  // ========== CANCEL ACTIONS ==========
  async cancelBooking(bookingRef: string): Promise<void> {
    await this.click(this.bookingCard(bookingRef).getByTestId('cancel-booking-btn'));
    await this.cancelDialog.waitFor({ state: 'visible', timeout: TIMEOUTS.short });
    await expect(this.cancelDialog).toContainText(bookingRef);
    await this.confirmCancelButton.click();
    await this.cancelDialog.waitFor({ state: 'hidden', timeout: TIMEOUTS.medium });
  }
}
