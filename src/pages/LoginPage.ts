import { type Page, type Locator } from '@playwright/test';
import { BasePage } from '../core/BasePage';
import { ROUTES } from '../config/routes';
import { TIMEOUTS } from '../utils/timeouts';

export class LoginPage extends BasePage {
  // ========== LOGIN FORM ==========
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    super(page);

    // ========== LOGIN FORM ==========
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
  }

  // ========== LOGIN ACTIONS ==========
  async navigate(): Promise<void> {
    await this.navigateTo(ROUTES.login);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(email: string, password: string): Promise<void> {
    await this.typeText(this.emailInput, email);
    await this.typeText(this.passwordInput, password);
    await this.signInButton.click();
    await this.page.waitForURL((url) => !url.pathname.startsWith(ROUTES.login), { timeout: TIMEOUTS.long });
  }

  async navigateAndLogin(email: string, password: string): Promise<void> {
    await this.navigate();
    await this.login(email, password);
  }
}
