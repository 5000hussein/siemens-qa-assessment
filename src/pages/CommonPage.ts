import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from '../core/BasePage';
import { TIMEOUTS } from '../utils/timeouts';

export class CommonPage extends BasePage {
  // ========== HEADER ==========
  readonly userEmailDisplay: Locator;

  constructor(page: Page) {
    super(page);

    // ========== HEADER ==========
    this.userEmailDisplay = page.getByTestId('user-email-display');
  }

  // ========== VERIFICATIONS ==========
  async verifySignedInAs(email: string): Promise<void> {
    await expect(this.userEmailDisplay).toHaveText(email, { timeout: TIMEOUTS.medium });
  }
}
