import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from '../core/BasePage';
import { TIMEOUTS } from '../utils/timeouts';

export class CommonPage extends BasePage {
  // ========== HEADER NAVIGATION ==========
  readonly navHome: Locator;
  readonly navEvents: Locator;
  readonly navMyBookings: Locator;
  readonly userEmailDisplay: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    super(page);

    // ========== HEADER NAVIGATION ==========
    this.navHome = page.getByTestId('nav-home');
    this.navEvents = page.getByTestId('nav-events');
    this.navMyBookings = page.getByTestId('nav-bookings');
    this.userEmailDisplay = page.getByTestId('user-email-display');
    this.logoutButton = page.getByTestId('logout-btn');
  }

  // ========== HEADER ACTIONS ==========
  async clickNavEvents(): Promise<void> {
    await this.navEvents.waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
    await this.navEvents.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickNavMyBookings(): Promise<void> {
    await this.navMyBookings.waitFor({ state: 'visible', timeout: TIMEOUTS.medium });
    await this.navMyBookings.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifySignedInAs(email: string): Promise<void> {
    await expect(this.userEmailDisplay).toHaveText(email, { timeout: TIMEOUTS.medium });
  }
}
